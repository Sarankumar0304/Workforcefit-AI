# WorkforceFit AI 🎯
### Scalable Video Assessment for Trusted Candidate Fitment
**Theme 5 – EDCS Karnataka Hackathon 2026**

---

## 📁 Project Structure

```
workforcefit-ai/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── VideoCapture.jsx
│   │   ├── FaceDetection.jsx
│   │   ├── AIInterviewer.jsx
│   │   ├── FitmentBadge.jsx
│   │   └── ProgressTracker.jsx
│   ├── pages/              # App screens
│   │   ├── Landing.jsx
│   │   ├── Registration.jsx
│   │   ├── Interview.jsx
│   │   ├── Results.jsx
│   │   └── AdminDashboard.jsx
│   ├── services/           # API & AI service calls
│   │   ├── aiInterviewer.js
│   │   ├── faceVerification.js
│   │   ├── speechAnalysis.js
│   │   ├── fitmentClassifier.js
│   │   └── duplicateDetection.js
│   ├── models/             # ML model configs & weights
│   │   ├── kannada_asr_config.json
│   │   ├── fitment_classifier.json
│   │   └── liveness_detector.json
│   └── utils/
│       ├── refIdGenerator.js
│       ├── languageDetect.js
│       └── fraudFlags.js
├── admin/                  # Admin Console (React)
│   ├── Dashboard.jsx
│   ├── CandidateTable.jsx
│   ├── DistrictFilter.jsx
│   └── AlertReview.jsx
├── docs/
│   ├── architecture.md
│   ├── api-spec.yaml
│   └── model-cards.md
├── public/
│   └── index.html
├── package.json
└── README.md
```

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | Flutter / React Native |
| Admin Console | React + Tailwind CSS |
| AI Interview Agent | OpenAI Whisper + GPT-4o / Gemini |
| Kannada ASR | Vakyansh / AI4Bharat Indic ASR |
| Face Verification | MediaPipe FaceMesh + DeepFace |
| Liveness Detection | OpenCV + Custom CNN |
| Fitment Classifier | scikit-learn / XGBoost |
| Backend API | FastAPI (Python) |
| Database | PostgreSQL + Redis |
| Storage | AWS S3 / Firebase Storage |
| Deployment | Docker + Kubernetes |

---

## 🎯 Fitment Categories

1. **✅ Job Ready** – High scores across all dimensions
2. **📚 Skill Enhancement Required** – Good potential, needs upskilling
3. **🔍 Manual Verification** – Ambiguous signals, needs human review
4. **⚠️ Insufficient Confidence** – Poor audio/video or low response quality
5. **🚨 Potential Impersonation** – Fraud signals detected

---

## 🗺️ Roadmap

### Phase 1 (MVP)
- [x] Mobile registration + Ref-ID generation
- [x] Face + voice liveness detection
- [x] Multilingual AI interviewer (Kannada/Hindi/English)
- [x] Fitment scoring model
- [x] Admin dashboard

### Phase 2
- [ ] Dialect-aware Kannada tuning (North/South Karnataka)
- [ ] Offline-first mobile app with sync
- [ ] Employer portal integration
- [ ] Batch processing for 10,000+ candidates/day
- [ ] WhatsApp-based interview fallback

---

## 📊 Sample Use Case Flow

```
Candidate Registers
      ↓
WorkforceFit AI creates Ref ID (WF-KA-2026-XXXXX)
      ↓
Face + Voice Validation (Liveness Check)
      ↓
AI conducts interview in Kannada
      ↓
NLP + Vision scoring
      ↓
Classification: "Requires Upskilling"
      ↓
Admin dashboard shows district-wise analytics
      ↓
Candidate notified via app + chatbot
```

---

## 🛡️ Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Network Latency | Local caching + async writes |
| System Overload | Adaptive throttling + circuit breakers |
| Fraud Attempts | High liveness detection + dedup |
| Dialect Variation | Continuous Kannada model tuning |
| Low Literacy | Voice-first, visual UX |

---

*Built for EDCS Karnataka – Theme 5: AI SkillFit*
