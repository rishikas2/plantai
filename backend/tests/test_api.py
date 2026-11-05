"""
Automated test suite for PlantCare AI FastAPI backend.
"""

from io import BytesIO
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)

def create_test_image_bytes(color=(40, 180, 50), size=(224, 224), fmt="JPEG") -> bytes:
    """Helper to create dummy RGB leaf image bytes."""
    img = Image.new("RGB", size, color=color)
    buf = BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "PlantCare AI"
    assert "api_endpoints" in data

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["supported_classes_count"] == 20

def test_get_all_diseases():
    response = client.get("/api/diseases")
    assert response.status_code == 200
    diseases = response.json()
    assert isinstance(diseases, list)
    assert len(diseases) >= 15
    first = diseases[0]
    assert "id" in first
    assert "symptoms" in first
    assert "prevention" in first
    assert "management" in first

def test_filter_diseases_by_plant():
    response = client.get("/api/diseases?plant=Tomato")
    assert response.status_code == 200
    diseases = response.json()
    assert len(diseases) > 0
    for d in diseases:
        assert "tomato" in d["plant"].lower()

def test_get_disease_by_id():
    response = client.get("/api/diseases/Tomato___Early_blight")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "Tomato___Early_blight"
    assert data["name"] == "Early Blight"
    assert data["plant"] == "Tomato"
    assert len(data["symptoms"]) > 0

def test_get_disease_not_found():
    response = client.get("/api/diseases/non_existent_disease_xyz")
    assert response.status_code == 404

def test_get_tips():
    response = client.get("/api/tips")
    assert response.status_code == 200
    tips = response.json()
    assert isinstance(tips, list)
    assert len(tips) >= 4
    first = tips[0]
    assert "title" in first
    assert "keyPoints" in first
    assert "actionSteps" in first

def test_get_model_info():
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["architecture"] == "MobileNetV2"
    assert data["is_model_loaded"] is True
    assert len(data["supported_classes"]) == 20

def test_predict_success():
    img_bytes = create_test_image_bytes()
    response = client.post(
        "/api/predict",
        files={"file": ("leaf.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    result = response.json()
    assert "prediction_id" in result
    assert "plant" in result
    assert "disease" in result
    assert "confidence" in result
    assert "confidence_percent" in result
    assert "confidence_level" in result
    assert "is_confident" in result
    assert "top_predictions" in result
    assert len(result["top_predictions"]) >= 3
    assert result["confidence"] >= 0.0 and result["confidence"] <= 1.0

def test_predict_invalid_file_type():
    response = client.post(
        "/api/predict",
        files={"file": ("document.pdf", b"%PDF-1.4...", "application/pdf")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_predict_empty_file():
    response = client.post(
        "/api/predict",
        files={"file": ("empty.jpg", b"", "image/jpeg")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"]

