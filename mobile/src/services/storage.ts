import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanHistoryItem, MonitoredPlant } from '../types';

const STORAGE_KEYS = {
  SCAN_HISTORY: '@plantcare_scan_history_v1',
  MONITORED_PLANTS: '@plantcare_monitored_plants_v1',
  ONBOARDING_DONE: '@plantcare_onboarding_completed_v1',
  API_URL: '@plantcare_api_url_v1',
};

// Default fallback API url (dynamically resolves to host PC IP for phone access)
export const DEFAULT_API_URL =
  typeof window !== 'undefined' && window.location && window.location.hostname
    ? `http://${window.location.hostname}:8000`
    : 'http://10.9.227.38:8000';

// ---------------- Scan History ----------------

export async function getScanHistory(): Promise<ScanHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load scan history:', err);
    return [];
  }
}

// Helper to compress/sanitize item for storage to avoid browser localStorage 5MB quota errors
function sanitizeItemForStorage(item: ScanHistoryItem): ScanHistoryItem {
  let sanitizedUri = item.imageUri;
  // If data URI is excessively large (> 60KB), truncate or omit image from persistent storage
  if (sanitizedUri && sanitizedUri.startsWith('data:') && sanitizedUri.length > 60000) {
    sanitizedUri = ''; // Keep metadata, omit massive raw base64 string from localStorage
  }
  return {
    ...item,
    imageUri: sanitizedUri,
  };
}

export async function saveScanItem(item: ScanHistoryItem): Promise<void> {
  try {
    const current = await getScanHistory();
    const sanitized = sanitizeItemForStorage(item);
    // Keep most recent 25 scans to stay well within browser quota
    const updated = [sanitized, ...current.filter((i) => i.id !== item.id)].slice(0, 25);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn('Storage quota exceeded, pruning older items and re-attempting:', quotaErr);
      // Prune to top 5 items without images
      const minimal = updated.slice(0, 5).map((i) => ({ ...i, imageUri: '' }));
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(minimal));
      } catch (innerErr) {
        console.warn('Could not persist scan history:', innerErr);
      }
    }

    // If item has a plantLabel, automatically update or create monitored plant record
    if (item.plantLabel && item.plantLabel.trim() !== '') {
      await addScanToMonitoredPlant(item.plantLabel.trim(), sanitized);
    }
  } catch (err) {
    console.warn('Non-fatal error saving scan item:', err);
  }
}

export async function deleteScanItem(id: string): Promise<void> {
  try {
    const current = await getScanHistory();
    const filtered = current.filter((i) => i.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete scan item:', err);
    throw err;
  }
}

export async function clearAllScanHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SCAN_HISTORY);
  } catch (err) {
    console.error('Failed to clear scan history:', err);
  }
}

// ---------------- Monitored Plants (Feature 7) ----------------

export async function getMonitoredPlants(): Promise<MonitoredPlant[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.MONITORED_PLANTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load monitored plants:', err);
    return [];
  }
}

export async function addScanToMonitoredPlant(label: string, scan: ScanHistoryItem): Promise<void> {
  try {
    const plants = await getMonitoredPlants();
    const existingIndex = plants.findIndex((p) => p.label.toLowerCase() === label.toLowerCase());

    if (existingIndex >= 0) {
      // Update existing plant record
      const existing = plants[existingIndex];
      const updatedScans = [scan, ...existing.scans.filter((s) => s.id !== scan.id)];
      plants[existingIndex] = {
        ...existing,
        plantType: scan.plant,
        lastUpdated: scan.timestamp,
        scans: updatedScans,
      };
    } else {
      // Create new monitored plant
      const newPlant: MonitoredPlant = {
        id: 'plant_' + Date.now().toString(),
        label: label,
        plantType: scan.plant,
        createdAt: scan.timestamp,
        lastUpdated: scan.timestamp,
        notes: `Monitored ${scan.plant}`,
        scans: [scan],
      };
      plants.unshift(newPlant);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.MONITORED_PLANTS, JSON.stringify(plants));
  } catch (err) {
    console.error('Failed to update monitored plant:', err);
  }
}

export async function deleteMonitoredPlant(plantId: string): Promise<void> {
  try {
    const plants = await getMonitoredPlants();
    const updated = plants.filter((p) => p.id !== plantId);
    await AsyncStorage.setItem(STORAGE_KEYS.MONITORED_PLANTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete monitored plant:', err);
  }
}

// ---------------- Onboarding & Settings ----------------

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
  } catch (err) {
    console.error('Failed to set onboarding status:', err);
  }
}

export async function getApiBaseUrl(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.API_URL);
    return val && val.trim() !== '' ? val : DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export async function setApiBaseUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.API_URL, url.trim());
  } catch (err) {
    console.error('Failed to save API URL:', err);
  }
}

