"""
Unit tests for Machine Learning preprocessing, parsing, and uncertainty handling.
"""

from io import BytesIO
import numpy as np
import pytest
from PIL import Image

from app.ml.dataset_loader import preprocess_image_bytes, load_labels
from app.ml.model_service import PlantCareInferenceService

def test_labels_loaded():
    labels = load_labels()
    assert isinstance(labels, list)
    assert len(labels) == 20
    assert "Tomato___Early_blight" in labels
    assert "Tomato___healthy" in labels

def test_preprocess_image_bytes_dimensions_and_scaling():
    # Create simple 300x400 image
    img = Image.new("RGB", (300, 400), color=(100, 150, 200))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    raw_bytes = buf.getvalue()

    tensor = preprocess_image_bytes(raw_bytes)
    assert tensor.shape == (1, 224, 224, 3)
    assert tensor.dtype == np.float32
    # Ensure normalized to [-1.0, 1.0]
    assert np.min(tensor) >= -1.0
    assert np.max(tensor) <= 1.0

def test_parse_class_id():
    plant, disease, is_healthy = PlantCareInferenceService.parse_class_id("Tomato___Early_blight")
    assert plant == "Tomato"
    assert disease == "Early Blight"
    assert is_healthy is False

    plant, disease, is_healthy = PlantCareInferenceService.parse_class_id("Tomato___healthy")
    assert plant == "Tomato"
    assert "Healthy" in disease
    assert is_healthy is True

    plant, disease, is_healthy = PlantCareInferenceService.parse_class_id("Pepper__bell___Bacterial_spot")
    assert plant == "Bell Pepper"
    assert disease == "Bacterial Spot"
    assert is_healthy is False

    plant, disease, is_healthy = PlantCareInferenceService.parse_class_id("Corn_(maize)___Common_rust_")
    assert plant == "Corn"
    assert disease == "Common Rust"
    assert is_healthy is False

