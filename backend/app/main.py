"""
PlantCare AI - FastAPI Application Entrypoint
AI-Powered Mobile Application Backend for Plant Disease Detection, Diagnosis Assistance, and Prevention.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.ml.model_service import get_inference_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("plantcare")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager: loads ML model once at startup into memory.
    """
    logger.info("Starting PlantCare AI Backend...")
    service = get_inference_service()
    if service.model is not None:
        logger.info("MobileNetV2 Plant Disease Classifier is ready for inference.")
    else:
        logger.warning("MobileNetV2 model could not be loaded at startup.")
    yield
    logger.info("Shutting down PlantCare AI Backend.")

app = FastAPI(
    title="PlantCare AI - Disease Detection API",
    description=(
        "Production-grade FastAPI inference and knowledge service for agricultural leaf disease diagnosis. "
        "Built with MobileNetV2 transfer learning, uncertainty calibration, and curated agronomic pathology guidance."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Native / Expo development and production web/mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api")

@app.get("/", summary="Root Welcome")
def root():
    return {
        "project": "PlantCare AI",
        "description": "AI-Powered Plant Disease Detection, Diagnosis Assistance, and Prevention",
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_endpoints": {
            "health": "/api/health",
            "predict": "/api/predict [POST]",
            "diseases": "/api/diseases [GET]",
            "tips": "/api/tips [GET]",
            "model_info": "/api/model-info [GET]"
        }
    }

