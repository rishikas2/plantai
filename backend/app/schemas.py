"""
Pydantic data models and API schemas for PlantCare AI.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

class PredictionRank(BaseModel):
    class_id: str
    plant: str
    disease: str
    confidence: float
    confidence_percent: float
    is_healthy: bool

class DiseaseDetail(BaseModel):
    id: str
    name: str
    plant: str
    scientificName: Optional[str] = None
    category: str
    isSupportedByModel: bool = True
    severity: str
    description: str
    symptoms: List[str]
    causes: List[str]
    favorableConditions: Optional[str] = None
    prevention: List[str]
    management: List[str]
    disclaimer: str
    sources: List[str]

class InferenceResponse(BaseModel):
    prediction_id: str
    timestamp: str
    plant: str
    disease: str
    class_id: str
    is_healthy: bool
    confidence: float
    confidence_percent: float
    confidence_level: str
    is_confident: bool
    uncertainty_message: Optional[str] = None
    top_predictions: List[PredictionRank]
    disease_details: Optional[DiseaseDetail] = None
    disclaimer: str = (
        "PlantCare AI is a preliminary educational screening tool. "
        "Symptoms may be caused by pests, nutrient deficiencies, or environmental stress. "
        "Always seek expert agricultural verification for severe issues or before applying chemical pesticides."
    )

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_architecture: str
    supported_classes_count: int
    version: str = "1.0.0"

class PlantTip(BaseModel):
    id: str
    category: str
    title: str
    subtitle: str
    summary: str
    icon: str
    readTimeMinutes: int
    keyPoints: List[str]
    actionSteps: List[str]

