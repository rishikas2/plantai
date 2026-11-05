export interface PredictionRank {
  class_id: string;
  plant: string;
  disease: string;
  confidence: number;
  confidence_percent: number;
  is_healthy: boolean;
}

export interface DiseaseDetail {
  id: string;
  name: string;
  plant: string;
  scientificName?: string;
  category: 'Fungal' | 'Bacterial' | 'Viral' | 'Healthy' | 'Nutritional/Abiotic' | 'Oomycete / Water Mold' | string;
  isSupportedByModel: boolean;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical' | 'None (Healthy)';
  description: string;
  symptoms: string[];
  causes: string[];
  favorableConditions?: string;
  prevention: string[];
  management: string[];
  disclaimer: string;
  sources: string[];
}

export interface InferenceResponse {
  prediction_id: string;
  timestamp: string;
  plant: string;
  disease: string;
  class_id: string;
  is_healthy: boolean;
  confidence: number;
  confidence_percent: number;
  confidence_level: 'High' | 'Moderate' | 'Low';
  is_confident: boolean;
  uncertainty_message?: string | null;
  top_predictions: PredictionRank[];
  disease_details?: DiseaseDetail | null;
  disclaimer: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  dateFormatted: string;
  imageUri: string;
  plant: string;
  disease: string;
  class_id: string;
  confidence: number;
  confidence_percent: number;
  confidence_level: 'High' | 'Moderate' | 'Low';
  is_healthy: boolean;
  is_confident: boolean;
  uncertainty_message?: string | null;
  plantLabel?: string;
  disease_details?: DiseaseDetail | null;
  top_predictions?: PredictionRank[];
  notes?: string;
}

export interface MonitoredPlant {
  id: string;
  label: string;
  plantType: string;
  createdAt: string;
  lastUpdated: string;
  notes?: string;
  scans: ScanHistoryItem[];
}

export interface PlantTip {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  summary: string;
  icon: string;
  readTimeMinutes: number;
  keyPoints: string[];
  actionSteps: string[];
}

export interface BackendHealth {
  status: string;
  model_loaded: boolean;
  model_architecture: string;
  supported_classes_count: number;
  version: string;
}

