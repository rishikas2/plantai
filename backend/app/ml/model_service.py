"""
Model inference and uncertainty handling service for PlantCare AI.
"""

import os
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import numpy as np
import tensorflow as tf

from app.config import (
    MODEL_PATH,
    LABELS_PATH,
    DISEASES_PATH,
    CONFIDENCE_THRESHOLD,
    UNCERTAINTY_MARGIN
)
from app.ml.dataset_loader import preprocess_image_bytes

logger = logging.getLogger(__name__)

class PlantCareInferenceService:
    def __init__(self):
        self.model: Optional[tf.keras.Model] = None
        self.labels: List[str] = []
        self.disease_db: Dict[str, Dict[str, Any]] = {}
        self._initialize()

    def _initialize(self):
        """Loads class labels, disease database, and pre-trained neural network."""
        # 1. Load labels
        if LABELS_PATH.exists():
            with open(LABELS_PATH, "r", encoding="utf-8") as f:
                self.labels = json.load(f)
            logger.info(f"Loaded {len(self.labels)} class labels.")
        else:
            logger.warning(f"Labels file {LABELS_PATH} not found.")

        # 2. Load disease knowledge base
        if DISEASES_PATH.exists():
            with open(DISEASES_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.disease_db = {item["id"]: item for item in data}
            logger.info(f"Loaded {len(self.disease_db)} disease records from knowledge base.")
        else:
            logger.warning(f"Disease DB {DISEASES_PATH} not found.")

        # 3. Load or train model
        self.load_model()

    def load_model(self) -> bool:
        """Loads saved MobileNetV2 model or builds and compiles if not yet saved."""
        try:
            if MODEL_PATH.exists():
                logger.info(f"Loading trained neural network from {MODEL_PATH}...")
                self.model = tf.keras.models.load_model(str(MODEL_PATH))
                logger.info("MobileNetV2 model loaded successfully!")
                return True
            else:
                logger.info("Model file not found. Running initial training to generate plantcare_mobilenetv2.keras...")
                from app.ml.train import train_model
                self.model, _ = train_model(epochs=3)
                logger.info("Initial model trained and loaded!")
                return True
        except Exception as e:
            logger.error(f"Error loading/training model: {e}", exc_info=True)
            self.model = None
            return False

    @staticmethod
    def parse_class_id(class_id: str) -> Tuple[str, str, bool]:
        """
        Parses dataset label strings like 'Tomato___Early_blight' into
        human-readable Plant, Disease, and Healthy status.
        """
        if "___" in class_id:
            parts = class_id.split("___")
            plant_raw, cond_raw = parts[0], parts[1]
        else:
            plant_raw, cond_raw = class_id, "Unknown"

        # Plant clean up
        plant_clean = plant_raw.replace("Pepper__bell", "Bell Pepper")
        plant_clean = plant_clean.replace("Corn_(maize)", "Corn")
        plant_clean = plant_clean.replace("_", " ").strip()

        # Disease clean up
        is_healthy = "healthy" in cond_raw.lower()
        if is_healthy:
            disease_clean = "Healthy (No Disease Detected)"
        else:
            disease_clean = cond_raw.replace("_", " ").strip().rstrip("_").strip()
            disease_clean = " ".join(word.capitalize() for word in disease_clean.split())

        return plant_clean, disease_clean, is_healthy

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Executes end-to-end inference workflow:
        1. Decodes and normalizes image for MobileNetV2
        2. Obtains softmax prediction probabilities
        3. Ranks candidate conditions
        4. Applies uncertainty handling
        5. Attaches curated knowledge base details
        """
        if self.model is None:
            # Attempt reloading
            if not self.load_model():
                raise RuntimeError("Inference model is unavailable.")

        # 1. Preprocess
        tensor = preprocess_image_bytes(image_bytes)

        # 2. Forward pass
        raw_probs = self.model.predict(tensor, verbose=0)[0]

        # 3. Rank top candidate predictions
        top_indices = np.argsort(raw_probs)[::-1]
        top_ranks = []
        for rank, idx in enumerate(top_indices[:5]):
            class_id = self.labels[idx] if idx < len(self.labels) else f"Class_{idx}"
            prob = float(raw_probs[idx])
            plant, disease, is_healthy = self.parse_class_id(class_id)
            top_ranks.append({
                "class_id": class_id,
                "plant": plant,
                "disease": disease,
                "confidence": prob,
                "confidence_percent": round(prob * 100, 1),
                "is_healthy": is_healthy
            })

        # Top prediction
        top1 = top_ranks[0]
        top2 = top_ranks[1] if len(top_ranks) > 1 else None

        confidence = top1["confidence"]
        confidence_percent = top1["confidence_percent"]

        # Confidence categorization
        if confidence >= 0.80:
            confidence_level = "High"
        elif confidence >= 0.58:
            confidence_level = "Moderate"
        else:
            confidence_level = "Low"

        # 4. Uncertainty handling logic (Feature 3)
        # If confidence is below threshold, or top two classes are extremely close and confidence is not high
        is_confident = True
        uncertainty_message = None

        if confidence < CONFIDENCE_THRESHOLD:
            is_confident = False
            uncertainty_message = (
                "We couldn't confidently identify the plant condition. "
                "Try taking a clearer photograph with better natural lighting, focus on a single leaf, "
                "or consult a local agricultural extension officer."
            )
        elif top2 is not None and (confidence - top2["confidence"]) < UNCERTAINTY_MARGIN and confidence < 0.70:
            is_confident = False
            uncertainty_message = (
                f"The image exhibits mixed visual patterns close to both {top1['disease']} ({top1['confidence_percent']}%) "
                f"and {top2['disease']} ({top2['confidence_percent']}%). "
                "Inspect the underside of leaves for diagnostic signs or consult an agricultural expert."
            )

        # 5. Retrieve disease information
        class_id = top1["class_id"]
        disease_details = self.disease_db.get(class_id)

        # If not found directly, search by plant and disease substring
        if not disease_details:
            for d in self.disease_db.values():
                if d.get("plant", "").lower() in top1["plant"].lower() and d.get("name", "").lower() in top1["disease"].lower():
                    disease_details = d
                    break

        return {
            "prediction_id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "plant": top1["plant"],
            "disease": top1["disease"],
            "class_id": class_id,
            "is_healthy": top1["is_healthy"],
            "confidence": confidence,
            "confidence_percent": confidence_percent,
            "confidence_level": confidence_level,
            "is_confident": is_confident,
            "uncertainty_message": uncertainty_message,
            "top_predictions": top_ranks,
            "disease_details": disease_details
        }

# Global singleton inference instance
_inference_service: Optional[PlantCareInferenceService] = None

def get_inference_service() -> PlantCareInferenceService:
    global _inference_service
    if _inference_service is None:
        _inference_service = PlantCareInferenceService()
    return _inference_service
