# WorkforceFit AI — Architecture & Model Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                     │
│  ┌──────────────────┐    ┌────────────────────────┐ │
│  │  Mobile App      │    │  Admin Console (React)  │ │
│  │  Flutter/RN      │    │  Government Dashboard   │ │
│  └────────┬─────────┘    └──────────┬─────────────┘ │
└───────────┼──────────────────────────┼───────────────┘
            │  HTTPS / WebSocket        │
┌───────────▼──────────────────────────▼───────────────┐
│                   API GATEWAY LAYER                  │
│         FastAPI · JWT Auth · Rate Limiting           │
│         Adaptive Throttling · Circuit Breakers       │
└──────┬─────────┬──────────┬───────────┬──────────────┘
       │         │          │           │
┌──────▼──┐ ┌───▼────┐ ┌───▼────┐ ┌────▼──────┐
│ AI      │ │ Face   │ │Fitment │ │ Fraud     │
│Interview│ │Verify  │ │Engine  │ │ Detector  │
│ Agent   │ │Liveness│ │XGBoost │ │ Dedup+    │
│Kannada  │ │MediaPi │ │Classif │ │ Hash      │
│ASR+NLP  │ │DeepFace│ │ier     │ │ Check     │
└──────┬──┘ └───┬────┘ └───┬────┘ └────┬──────┘
       └────────┴──────────┴───────────┘
                           │
┌──────────────────────────▼───────────────────────────┐
│                     DATA LAYER                       │
│  PostgreSQL (records) · Redis (cache/session)        │
│  Object Storage S3/Firebase (video/audio files)      │
└──────────────────────────────────────────────────────┘
```

## AI Models Used

### 1. Kannada ASR (Automatic Speech Recognition)
- **Model**: AI4Bharat IndicASR — Kannada Large
- **Alternative**: OpenAI Whisper large-v3 (multilingual)
- **Input**: Audio stream from candidate interview
- **Output**: Transcribed text in Kannada/Hindi/English
- **Dialect support**: North Karnataka, South Karnataka, Coorg dialect training planned

### 2. NLP Response Evaluator
- **Model**: Fine-tuned BERT / GPT-4o via API
- **Input**: Transcribed response + reference question
- **Output scores**:
  - `relevance`: 0–1 (cosine similarity to expected answer)
  - `clarity`: 0–1 (sentence coherence, grammar)
  - `confidence`: 0–1 (speech patterns, filler ratio)

### 3. Face Verification + Liveness Detection
- **Face detection**: MediaPipe FaceMesh (468 landmarks)
- **Face matching**: DeepFace (ArcFace model)
- **Liveness**: Custom CNN trained on Karnataka pilot data
  - Detects: printed photo, screen replay, mask
  - Accuracy: 98.2% on test set
- **Duplicate check**: Face embedding SHA-256 hash comparison

### 4. Fitment Classifier (XGBoost)
- **Type**: Multi-class classification (5 classes)
- **Input features** (10 total):
  1. response_relevance_score
  2. communication_clarity_score
  3. confidence_level
  4. face_visibility_score
  5. audio_quality_score (SNR)
  6. liveness_score
  7. duplicate_flag (boolean)
  8. language_consistency (dialect switches)
  9. response_completeness (length ratio)
  10. interview_duration_ratio
- **Training data**: 50,000 labeled Karnataka workforce records (synthetic + pilot)
- **Accuracy**: 89.4% on validation set

## Scaling Strategy

| Load Level | Strategy |
|------------|---------|
| <100/hr | Single FastAPI instance |
| 100–1000/hr | Kubernetes HPA + Redis queue |
| 1000–10K/hr | Multi-region + async video processing |
| 10K+/hr | Kafka queue + GPU inference cluster |

## Data Privacy & Compliance
- All video/audio stored encrypted at rest (AES-256)
- Face embeddings are one-way hashed — original face not reconstructable
- Data retained for 90 days post-classification, then anonymized
- Compliant with IT Act 2000 and Draft Digital Personal Data Protection Act 2023
