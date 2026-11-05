"""
FastAPI route handlers for PlantCare AI.
"""

import json
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, status

from app.config import (
    MAX_UPLOAD_SIZE_BYTES,
    ALLOWED_CONTENT_TYPES,
    DISEASES_PATH,
    TIPS_PATH,
    MODEL_PATH,
    LABELS_PATH
)
from app.schemas import (
    InferenceResponse,
    DiseaseDetail,
    HealthResponse,
    PlantTip
)
from app.ml.model_service import get_inference_service

router = APIRouter()

@router.post("/predict", response_model=InferenceResponse, summary="Analyze plant leaf image")
async def predict_plant_disease(file: UploadFile = File(...)):
    """
    Submits a leaf photograph for neural network inference.
    - Validates image content-type and size.
    - Processes with MobileNetV2 deep learning classifier.
    - Returns prediction, confidence score, uncertainty analysis, and disease care data.
    """
    # 1. Validate content type
    if file.content_type and file.content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Please upload a JPEG, PNG, or WebP image."
        )

    # 2. Read file bytes and validate size
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded image: {str(e)}"
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty. Please select a valid plant photograph."
        )

    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds 10MB limit. Current size is {len(contents) / (1024*1024):.2f}MB."
        )

    # 3. Execute inference pipeline
    service = get_inference_service()
    try:
        result = service.predict(contents)
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failure: {str(e)}"
        )

@router.get("/diseases", response_model=List[DiseaseDetail], summary="Browse disease knowledge base")
def get_all_diseases(
    plant: Optional[str] = Query(None, description="Filter by plant species (e.g. Tomato, Potato)"),
    category: Optional[str] = Query(None, description="Filter by disease category (e.g. Fungal, Bacterial)"),
    supported_only: Optional[bool] = Query(False, description="Filter to conditions supported by the ML model")
):
    """
    Returns curated plant disease records from the knowledge base.
    """
    if not DISEASES_PATH.exists():
        return []

    with open(DISEASES_PATH, "r", encoding="utf-8") as f:
        diseases: List[dict] = json.load(f)

    # Apply filters
    filtered = diseases
    if plant:
        filtered = [d for d in filtered if plant.lower() in d.get("plant", "").lower()]
    if category:
        filtered = [d for d in filtered if category.lower() == d.get("category", "").lower()]
    if supported_only:
        filtered = [d for d in filtered if d.get("isSupportedByModel", False) is True]

    return filtered

@router.get("/diseases/{disease_id}", response_model=DiseaseDetail, summary="Get single disease details")
def get_disease_by_id(disease_id: str):
    """
    Returns complete symptoms, causes, prevention, and management guidance for a disease.
    """
    if not DISEASES_PATH.exists():
        raise HTTPException(status_code=404, detail="Disease database not found")

    with open(DISEASES_PATH, "r", encoding="utf-8") as f:
        diseases: List[dict] = json.load(f)

    for d in diseases:
        if d["id"].lower() == disease_id.lower():
            return d

    raise HTTPException(status_code=404, detail=f"Disease with ID '{disease_id}' not found")

@router.get("/tips", response_model=List[PlantTip], summary="Get educational plant care tips")
def get_tips(category: Optional[str] = Query(None, description="Filter tips by category")):
    """
    Returns curated educational plant health and gardening guidelines.
    """
    if not TIPS_PATH.exists():
        return []

    with open(TIPS_PATH, "r", encoding="utf-8") as f:
        tips: List[dict] = json.load(f)

    if category:
        tips = [t for t in tips if category.lower() in t.get("category", "").lower()]

    return tips

@router.get("/model-info", summary="Model specifications and supported classes")
def get_model_info():
    """
    Returns metadata about the active ML classifier, supported classes, and metrics.
    """
    service = get_inference_service()
    metrics_path = MODEL_PATH.parent / "training_metrics.json"
    eval_path = MODEL_PATH.parent / "evaluation_report.json"

    metrics_data = {}
    if metrics_path.exists():
        with open(metrics_path, "r", encoding="utf-8") as f:
            metrics_data = json.load(f)

    eval_data = {}
    if eval_path.exists():
        with open(eval_path, "r", encoding="utf-8") as f:
            eval_data = json.load(f)

    return {
        "architecture": "MobileNetV2",
        "input_dimensions": [224, 224, 3],
        "preprocessing": "Normalized to range [-1.0, 1.0]",
        "total_classes": len(service.labels),
        "supported_classes": service.labels,
        "is_model_loaded": service.model is not None,
        "training_summary": metrics_data,
        "evaluation_summary": eval_data.get("overall_metrics", {}),
        "uncertainty_threshold": 0.58,
        "limitations": [
            "Evaluated on leaf-level photography.",
            "Visual identification is indicative and cannot replace laboratory ELISA or PCR testing.",
            "Unsupported plants or severe out-of-focus images will trigger uncertainty warnings."
        ]
    }

@router.get("/health", response_model=HealthResponse, summary="Backend health check")
def health_check():
    """
    Verifies service health and neural network model status.
    """
    service = get_inference_service()
    return HealthResponse(
        status="healthy",
        model_loaded=service.model is not None,
        model_architecture="MobileNetV2",
        supported_classes_count=len(service.labels),
        version="1.0.0"
    )

