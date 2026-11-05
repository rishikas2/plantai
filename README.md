# PlantCare AI 🌿

> **An AI-Powered Mobile Application for Plant Disease Detection, Diagnosis Assistance, and Prevention**

PlantCare AI is an end-to-end, production-grade mobile solution designed for farmers, gardeners, plant nursery owners, agricultural students, and hobbyists. It combines lightweight deep learning computer vision (**MobileNetV2** transfer learning), calibrated uncertainty analysis, and an extensive curated plant pathology knowledge base to deliver accessible preliminary crop diagnosis without expensive cloud infrastructure.

---

## 📑 Table of Contents

- [1. Problem Statement & Objectives](#1-problem-statement--objectives)
- [2. System Architecture](#2-system-architecture)
- [3. Supported Plant-Disease Conditions](#3-supported-plant-disease-conditions)
- [4. Core Application Features](#4-core-application-features)
- [5. Machine Learning Implementation](#5-machine-learning-implementation)
- [6. Backend Installation & Execution](#6-backend-installation--execution)
- [7. Mobile Application Setup & Run](#7-mobile-application-setup--run)
- [8. Automated Testing & Verification](#8-automated-testing--verification)
- [9. Safety, Limitations & Agronomic Disclaimers](#9-safety-limitations--agronomic-disclaimers)
- [10. Project Structure](#10-project-structure)

---

## 1. Problem Statement & Objectives

Plant leaf spots, lesions, chlorosis, and wilting lead to massive agricultural losses globally. Early visual identification is critical to stopping pathogen spread before crops are devastated. However, smallholder farmers and home gardeners often lack immediate access to certified plant pathologists or diagnostic laboratories.

**PlantCare AI** provides:
- **Instant Leaf Image Diagnosis**: Fast on-device and backend inference for 20 supported conditions across Tomato, Potato, Bell Pepper, Corn, and Apple crops.
- **Calibrated Uncertainty Handling**: Flags ambiguous or low-confidence scans with constructive guidance rather than presenting unverified guesses.
- **Comprehensive Agronomic Guidance**: Delivers scientifically validated symptoms, pathogen causes, environmental triggers, cultural management, and prevention strategies.
- **Specimen Health Monitoring**: Allows tagging plants (e.g., *"Tomato Plant 1"*) and comparing historical scans side-by-side to track changes over time.
- **100% Offline Capability**: Works fully in offline field environments using bundled fallback databases and local `AsyncStorage`.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────┐
│               PlantCare AI Mobile (Expo / RN)          │
│  - React Native (TypeScript) + Expo Router             │
│  - Camera & Photo Gallery Access (expo-image-picker)   │
│  - Local Scan History & Monitoring (AsyncStorage)      │
│  - Offline Fallback Engine & Curated JSON Knowledge    │
└───────────────────────────┬────────────────────────────┘
                            │ Multi-part Image Upload
                            │ (POST /api/predict)
                            ▼
┌────────────────────────────────────────────────────────┐
│               PlantCare AI Backend (FastAPI)           │
│  - Python 3.12+ / FastAPI / Uvicorn (Port 8000)        │
│  - Image Validation & 224x224 RGB Normalization        │
│  - Uncertainty Engine (58% Threshold / 10% Margin)     │
│  - RESTful APIs (/api/predict, /diseases, /tips)       │
└───────────────────────────┬────────────────────────────┘
                            │ Preprocessed Tensor
                            ▼
┌────────────────────────────────────────────────────────┐
│            MobileNetV2 Deep Learning Model             │
│  - TensorFlow 2.15+ / Keras Transfer Learning          │
│  - Frozen Feature Extractor + Dense Classification     │
│  - Output: 20-Class Softmax Probability Distribution   │
└────────────────────────────────────────────────────────┘
```

---

## 3. Supported Plant-Disease Conditions

The trained MobileNetV2 classifier currently supports **20 agricultural conditions**:

| Plant Species | Condition Name | Pathogen / Type | Model Supported |
| :--- | :--- | :--- | :---: |
| **Tomato** | Early Blight | *Alternaria solani* (Fungal) | ✅ Yes |
| **Tomato** | Late Blight | *Phytophthora infestans* (Oomycete) | ✅ Yes |
| **Tomato** | Bacterial Spot | *Xanthomonas* spp. (Bacterial) | ✅ Yes |
| **Tomato** | Leaf Mold | *Passalora fulva* (Fungal) | ✅ Yes |
| **Tomato** | Septoria Leaf Spot | *Septoria lycopersici* (Fungal) | ✅ Yes |
| **Tomato** | Target Spot | *Corynespora cassiicola* (Fungal) | ✅ Yes |
| **Tomato** | Tomato Mosaic Virus | ToMV (Viral) | ✅ Yes |
| **Tomato** | Yellow Leaf Curl Virus | TYLCV (Viral) | ✅ Yes |
| **Tomato** | Healthy Foliage | Healthy Specimen | ✅ Yes |
| **Potato** | Early Blight | *Alternaria solani* (Fungal) | ✅ Yes |
| **Potato** | Late Blight | *Phytophthora infestans* (Oomycete) | ✅ Yes |
| **Potato** | Healthy Foliage | Healthy Specimen | ✅ Yes |
| **Bell Pepper** | Bacterial Spot | *Xanthomonas campestris* (Bacterial) | ✅ Yes |
| **Bell Pepper** | Healthy Foliage | Healthy Specimen | ✅ Yes |
| **Corn (Maize)**| Common Rust | *Puccinia sorghi* (Fungal) | ✅ Yes |
| **Corn (Maize)**| Healthy Foliage | Healthy Specimen | ✅ Yes |
| **Apple** | Apple Scab | *Venturia inaequalis* (Fungal) | ✅ Yes |
| **Apple** | Black Rot (Frogeye) | *Botryosphaeria obtusa* (Fungal) | ✅ Yes |
| **Apple** | Cedar Apple Rust | *Gymnosporangium* (Fungal) | ✅ Yes |
| **Apple** | Healthy Foliage | Healthy Specimen | ✅ Yes |

### Educational Knowledge Base Extensions
The app also catalogues non-model conditions for agricultural student study:
- *Powdery Mildew* (Multiple hosts)
- *Downy Mildew* (Cucurbits / Grapes)
- *Blossom End Rot* (Abiotic Calcium Deficiency)
- *Nitrogen Chlorosis* (Abiotic Nutritional Stress)

---

## 4. Core Application Features

1. **Home Dashboard**
   - Agricultural forest-green aesthetic (`#1E5631`) with warm off-white surfaces (`#F8F9FA`).
   - Quick statistics strip (total scans, supported conditions count, model architecture).
   - "Analyze Leaf" primary call-to-action button and gallery upload button.
   - Recent diagnostic scans summary and quick navigation cards.
2. **Camera & Gallery Image Selection**
   - Interactive camera viewfinder with alignment corner brackets.
   - Photography guidelines (centering, lighting, single subject, focus lock).
3. **Pre-Analysis Verification & Loading Screen**
   - High-resolution preview with retake and replace options.
   - Optional plant labeling field (e.g., *"Tomato Plant 1"*).
   - Multi-step loading modal showing preprocessing and inference stages.
4. **Detailed Diagnosis Results**
   - **Detection Summary**: Leaf photograph, predicted plant, disease name, and health pill.
   - **Confidence Score Indicator**: Visual percentage bar color-coded by confidence tier.
   - **Uncertainty Alert Banner**: Displayed when confidence is < 58% or classes are ambiguous.
   - **Ranked Alternatives**: Top candidate conditions with respective softmax probabilities.
   - **Comprehensive Pathology Sections**: Overview, symptoms, causes, management, and prevention.
5. **Local Scan History**
   - Local device persistence with `AsyncStorage`.
   - Thumbnail cards, timestamps, confidence scores, and filter tabs (*All*, *Diseased*, *Healthy*).
   - Detail view and record deletion options.
6. **Plant Health Monitoring & Comparison**
   - Group scans under specimen labels.
   - Side-by-side comparison displaying previous vs latest observation dates, confidence shifts, and condition stability.
   - Scientifically neutral explanations regarding environmental and model variability.
7. **Plant Disease Library**
   - Real-time search by plant, disease name, or scientific pathogen.
   - Filtering by disease category (*Fungal*, *Bacterial*, *Viral*, *Healthy*, *Nutritional*).
   - Toggle to isolate model-predictable conditions vs educational guides.
8. **Educational Plant Care Section**
   - Curated agricultural guides on leaf scouting, smart drip watering, tool sterilization, and when to contact farm extension offices.
9. **Settings & Disclaimers**
   - Configurable FastAPI endpoint (supports localhost, Android emulator `10.0.2.2:8000`, and local WiFi LAN IP).
   - Live backend connectivity health probe.
   - Transparent documentation of model limitations and pesticide safety notices.

---

## 5. Machine Learning Implementation

### Architecture
- **Base Architecture**: `MobileNetV2` initialized with ImageNet pre-trained weights.
- **Feature Head**:
  - `GlobalAveragePooling2D`
  - `BatchNormalization`
  - `Dense(256, activation='relu')`
  - `Dropout(0.35)`
  - `Dense(20, activation='softmax')`
- **Input Dimensions**: `(224, 224, 3)`
- **Normalization**: Pixel values normalized to `[-1.0, 1.0]`.

### Reproducible Training Pipeline
Run the training script anytime to re-train and export the model:
```bash
cd backend
python -m app.ml.train
```
This produces:
- `backend/app/ml/plantcare_mobilenetv2.keras` (Saved Keras model file)
- `backend/app/ml/training_metrics.json` (Phase 1 & Phase 2 loss/accuracy histories)

### Evaluation Metrics
Run model evaluation on held-out test splits:
```bash
cd backend
python -m app.ml.evaluate
```
Outputs `backend/app/ml/evaluation_report.json` with:
- Overall Accuracy
- Macro & Weighted Precision, Recall, and F1-Scores
- Confusion Matrix
- Per-class precision, recall, and support

---

## 6. Backend Installation & Execution

### Prerequisites
- Python 3.10+ (Anaconda Python 3.12+ recommended)
- pip

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the FastAPI Inference Server
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The server will start and automatically load the trained `MobileNetV2` model:
```
INFO:     PlantCare AI Backend started on http://127.0.0.1:8000
INFO:     MobileNetV2 Plant Disease Classifier is ready for inference.
```

### 3. API Documentation
Once running, open your browser to inspect interactive Swagger documentation:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Model Metadata**: [http://127.0.0.1:8000/api/model-info](http://127.0.0.1:8000/api/model-info)

---

## 7. Mobile Application Setup & Run

### Prerequisites
- Node.js 18+ and npm

### 1. Install Mobile Packages
```bash
cd mobile
npm install --legacy-peer-deps
```

### 2. Run the App

#### Run in Web Browser
```bash
cd mobile
npx expo start --web
```

#### Run on Android Device / Emulator
1. Start the Expo development server:
   ```bash
   cd mobile
   npx expo start
   ```
2. Press `a` in the terminal to launch on an attached Android emulator.
3. Or open the **Expo Go** app on your physical Android phone and scan the displayed QR code.
4. *Tip for physical phones*: In the app's **Settings** screen, change the API URL from `http://localhost:8000` to your computer's local Wi-Fi IP address (e.g., `http://192.168.1.15:8000`).

---

## 8. Automated Testing & Verification

The backend includes a comprehensive `pytest` suite testing all API endpoints, image decoding, error handling, and ML uncertainty calibration:

```bash
cd backend
python -m pytest tests/
```

### Test Coverage Highlights
- `test_root_endpoint`: Verifies root welcome and API route index.
- `test_health_check`: Confirms model is loaded with 20 supported classes.
- `test_get_all_diseases`: Validates curated knowledge base loading.
- `test_filter_diseases_by_plant`: Checks query parameter filtering.
- `test_get_disease_by_id`: Verifies single disease record retrieval.
- `test_get_tips`: Confirms educational plant care guide retrieval.
- `test_get_model_info`: Validates metadata and supported classes.
- `test_predict_success`: Submits synthetic leaf image and verifies structured response schema.
- `test_predict_invalid_file_type`: Verifies HTTP 400 rejection on non-image files.
- `test_predict_empty_file`: Verifies HTTP 400 rejection on empty payloads.
- `test_labels_loaded`: Asserts labels.json integrity.
- `test_preprocess_image_bytes_dimensions_and_scaling`: Validates tensor scaling to `[-1.0, 1.0]`.
- `test_parse_class_id`: Confirms label parsing to human-readable strings.

---

## 9. Safety, Limitations & Agronomic Disclaimers

1. **Preliminary Educational Screening**: PlantCare AI is an educational diagnostic aid. It is **not** a legal or formal substitute for laboratory assay testing (ELISA, PCR) or professional agronomist field inspection.
2. **Uncertainty Principle**: When leaf symptoms are atypical, lighting is uneven, or the specimen belongs to an unsupported plant family, the system returns a low-confidence notice encouraging expert consultation.
3. **No Automated Pesticide Prescriptions**: The application focuses on cultural practices (airflow, drip irrigation, sanitation, crop rotation). It explicitly refrains from recommending arbitrary chemical pesticide dosages.
4. **Data Privacy**: No photographed images or user scans are stored on remote cloud databases. All history and photos reside in device local storage.

---

## 10. Project Structure

```
smartphone/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application entrypoint with CORS & lifespan
│   │   ├── config.py                # Config thresholds (0.58 confidence threshold) & paths
│   │   ├── schemas.py               # Pydantic data schemas
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py            # API routes (/predict, /diseases, /tips, /model-info)
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   ├── dataset_loader.py    # Image validation, scaling, and dataset generation
│   │   │   ├── train.py             # MobileNetV2 transfer learning training pipeline
│   │   │   ├── evaluate.py          # Model evaluation script (Accuracy, F1, Confusion Matrix)
│   │   │   ├── model_service.py     # Singleton inference service & uncertainty scorer
│   │   │   ├── labels.json          # 20 supported class mappings
│   │   │   ├── plantcare_mobilenetv2.keras # Trained neural network model
│   │   │   ├── training_metrics.json       # Training loss and accuracy history
│   │   │   └── evaluation_report.json      # Evaluation report and confusion matrix
│   │   └── data/
│   │       ├── diseases.json        # Curated disease knowledge base
│   │       └── tips.json            # Curated plant care and gardening educational tips
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_api.py              # API test suite (11 test cases)
│   │   └── test_inference.py        # ML tensor & parsing test suite (3 test cases)
│   └── requirements.txt             # Python dependencies
├── mobile/
│   ├── app/                         # Expo Router screens
│   │   ├── _layout.tsx              # Root stack navigator & onboarding check
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx          # Bottom tab bar (Home, Scan, History, Monitor, Library)
│   │   │   ├── index.tsx            # Home Dashboard (Feature 1)
│   │   │   ├── scan.tsx             # Scan launcher & photography guide (Feature 2)
│   │   │   ├── history.tsx          # Local scan history & filters (Feature 6)
│   │   │   ├── monitor.tsx          # Plant health monitoring list (Feature 7)
│   │   │   └── library.tsx          # Searchable disease knowledge base (Feature 5)
│   │   ├── preview.tsx              # Image preview & pre-flight checklist (Screen 5)
│   │   ├── results.tsx              # Detailed disease diagnosis results (Feature 4)
│   │   ├── comparison.tsx           # Side-by-side plant health comparison (Screen 12)
│   │   ├── disease/[id].tsx         # Disease pathology profile (Screen 11)
│   │   ├── history/[id].tsx         # Archived scan inspector (Screen 9)
│   │   ├── tips.tsx                 # Educational plant care guide (Feature 8)
│   │   ├── onboarding.tsx           # 3-step first-time walkthrough (Screen 2)
│   │   └── settings.tsx             # Settings, server IP, model specs & safety (Screen 14)
│   ├── src/
│   │   ├── components/              # ConfidenceBadge, UncertaintyBanner, Header, EmptyState
│   │   ├── constants/theme.ts       # Forest-green agricultural theme palette
│   │   ├── services/
│   │   │   ├── api.ts               # API client & offline fallback engine
│   │   │   └── storage.ts           # AsyncStorage service for scans & monitored plants
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   └── data/                    # Bundled offline fallback databases
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   └── babel.config.js
└── README.md
```

