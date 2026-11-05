import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../src/constants/theme';
import { getApiBaseUrl, setApiBaseUrl, clearAllScanHistory, DEFAULT_API_URL } from '../src/services/storage';
import { checkBackendHealth } from '../src/services/api';
import { BackendHealth } from '../src/types';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<BackendHealth | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      const url = await getApiBaseUrl();
      setApiUrl(url);
      handleCheckHealth(url);
    }
    load();
  }, []);

  const handleSaveUrl = async () => {
    setIsSaving(true);
    await setApiBaseUrl(apiUrl);
    setIsSaving(false);
    Alert.alert('Settings Saved', 'API backend endpoint updated successfully.');
    handleCheckHealth(apiUrl);
  };

  const handleResetDefaultUrl = async () => {
    setApiUrl(DEFAULT_API_URL);
    await setApiBaseUrl(DEFAULT_API_URL);
    handleCheckHealth(DEFAULT_API_URL);
  };

  const handleCheckHealth = async (url?: string) => {
    setIsCheckingHealth(true);
    const health = await checkBackendHealth();
    setHealthStatus(health);
    setIsCheckingHealth(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear All Diagnostic History',
      'Are you sure you want to delete all saved scans and photos on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllScanHistory();
            Alert.alert('History Cleared', 'All local scan records have been deleted.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Backend API Configuration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>Inference Backend Endpoint</Text>
        </View>
        <Text style={styles.cardSub}>
          Configure the FastAPI host URL. Use localhost for web, 10.0.2.2:8000 for Android emulator, or your PC LAN IP for physical phones.
        </Text>

        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="http://localhost:8000"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.urlBtnRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl} activeOpacity={0.8}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save URL</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetDefaultUrl} activeOpacity={0.8}>
            <Text style={styles.resetBtnText}>Reset Default</Text>
          </TouchableOpacity>
        </View>

        {/* Live Connectivity Indicator */}
        <View style={styles.healthStatusBox}>
          <View style={styles.healthHeader}>
            <Text style={styles.healthTitle}>Server Connection:</Text>
            <TouchableOpacity onPress={() => handleCheckHealth()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {isCheckingHealth ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="refresh" size={16} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.statusPillRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: healthStatus ? COLORS.healthy : COLORS.danger },
              ]}
            />
            <Text style={styles.healthStatusText}>
              {healthStatus
                ? `Online (${healthStatus.model_architecture} • ${healthStatus.supported_classes_count} classes loaded)`
                : 'Offline or Unreachable (Local offline engine active)'}
            </Text>
          </View>
        </View>
      </View>

      {/* AI Model Architecture & Specs */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="hardware-chip-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>Machine Learning Specifications</Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Architecture:</Text>
          <Text style={styles.specVal}>MobileNetV2 (Transfer Learning)</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Input Dimensions:</Text>
          <Text style={styles.specVal}>224 × 224 × 3 RGB</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Supported Classes:</Text>
          <Text style={styles.specVal}>20 Plant-Disease Conditions</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Uncertainty Threshold:</Text>
          <Text style={styles.specVal}>58% Confidence / 10% Margin</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specLabel}>Inference Framework:</Text>
          <Text style={styles.specVal}>TensorFlow / Keras & FastAPI</Text>
        </View>
      </View>

      {/* Important Limitations & Safety (Section 9) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-outline" size={20} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={[styles.cardTitle, { color: '#92400E' }]}>Important Limitations & Safety</Text>
        </View>

        <Text style={styles.limitText}>
          • <Text style={styles.limitBold}>Preliminary Screening Tool:</Text> PlantCare AI assists with early detection but is NOT a substitute for formal laboratory ELISA/PCR testing or agronomic expert diagnosis.
        </Text>
        <Text style={styles.limitText}>
          • <Text style={styles.limitBold}>Uncertainty Calibration:</Text> Predictions below calibrated confidence thresholds are flagged with uncertainty warnings.
        </Text>
        <Text style={styles.limitText}>
          • <Text style={styles.limitBold}>Multi-Factor Symptoms:</Text> Foliage symptoms may result from pathogens, nutrient deficiencies, watering stress, or pest bites.
        </Text>
        <Text style={styles.limitText}>
          • <Text style={styles.limitBold}>Responsible Pesticide Use:</Text> Never apply synthetic chemicals solely based on computer vision without consulting your local agricultural extension service.
        </Text>
      </View>

      {/* Storage Management */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="folder-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>Storage & Privacy</Text>
        </View>
        <Text style={styles.cardSub}>
          All scans and image references are stored exclusively on your local device. No images are permanently stored in the cloud.
        </Text>

        <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} style={{ marginRight: 6 }} />
          <Text style={styles.clearBtnText}>Clear Local Scan History</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerVersion}>PlantCare AI • Version 1.0.0 • College Major Project</Text>
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
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 17,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  urlBtnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  saveBtn: {
    flex: 1.5,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  healthStatusBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 2,
    marginTop: SPACING.md,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  healthTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  healthStatusText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  specLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  limitText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 6,
  },
  limitBold: {
    fontWeight: '700',
    color: '#92400E',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
  },
  clearBtnText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  footerVersion: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
