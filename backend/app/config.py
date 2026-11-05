"""
Configuration settings for PlantCare AI FastAPI backend.
"""

from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
ML_DIR = BASE_DIR / "ml"

# Model paths
MODEL_PATH = ML_DIR / "plantcare_mobilenetv2.keras"
LABELS_PATH = ML_DIR / "labels.json"
DISEASES_PATH = DATA_DIR / "diseases.json"
TIPS_PATH = DATA_DIR / "tips.json"

# Inference and Uncertainty thresholds
# Feature 3: Determine whether prediction meets configured confidence requirements
CONFIDENCE_THRESHOLD = 0.58  # Below this, prediction is flagged as uncertain
UNCERTAINTY_MARGIN = 0.10    # If top1 - top2 is below this and top1 < 0.70, flag as ambiguous

# Upload limits
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}

