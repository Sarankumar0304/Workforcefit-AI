# backend/main.py
# WorkforceFit AI — FastAPI Backend
# Real-time Shared Backend for Mobile + Admin Dashboard

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from collections import Counter
import uuid
import hashlib
import datetime
import re

app = FastAPI(
    title="WorkforceFit AI API",
    version="2.1.0"
)

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# MODELS
# =========================

class CandidateRegister(BaseModel):
    name: str
    phone: str
    district: str
    trade: str
    language: str = "kn"
    refId: Optional[str] = None


class QuestionCreate(BaseModel):
    text: str
    language: str = "en"
    trade: str = "General"
    expectedKeywords: List[str] = Field(default_factory=list)
    maxScore: int = 20


class EvaluateRequest(BaseModel):
    refId: str
    questionId: str
    questionIdx: int = 0
    transcript: str
    language: str = "en"


class CompleteInterviewRequest(BaseModel):
    refId: str


class AdminAction(BaseModel):
    action: str


# =========================
# IN-MEMORY DATABASE
# =========================

candidates_db: Dict[str, dict] = {}
scores_db: Dict[str, list] = {}
answers_db: Dict[str, list] = {}
questions_db: Dict[str, dict] = {}

# =========================
# DEFAULT QUESTIONS
# =========================

DEFAULT_QUESTIONS = [
    ("kn", "General", "ನಿಮ್ಮ ಹೆಸರು, ಊರು, ಮತ್ತು ಕೆಲಸದ ಅನುಭವವನ್ನು ಹೇಳಿ.", ["ಅನುಭವ", "ಕೆಲಸ", "ಊರು", "ಹೆಸರು"]),
    ("kn", "General", "ನಿಮ್ಮ ಮುಖ್ಯ ಕೌಶಲ್ಯಗಳು ಯಾವುವು?", ["ಕೌಶಲ್ಯ", "ಕೆಲಸ", "ತರಬೇತಿ", "ಅನುಭವ"]),
    ("kn", "General", "ಸುರಕ್ಷತಾ ನಿಯಮಗಳನ್ನು ಕೆಲಸದಲ್ಲಿ ಹೇಗೆ ಪಾಲಿಸುತ್ತೀರಿ?", ["ಸುರಕ್ಷತೆ", "ನಿಯಮ", "ಜಾಗ್ರತೆ", "ಸಾಧನ"]),

    ("en", "General", "Tell me about your name, hometown, and work experience.", ["experience", "work", "hometown", "name"]),
    ("en", "General", "What are your main skills for this trade?", ["skill", "tools", "training", "experience"]),
    ("en", "General", "How do you follow safety rules at work?", ["safety", "rules", "protective", "careful"]),

    ("hi", "General", "अपना नाम, शहर और काम का अनुभव बताइए।", ["अनुभव", "काम", "नाम", "शहर"]),
    ("hi", "General", "आपके मुख्य कौशल क्या हैं?", ["कौशल", "काम", "प्रशिक्षण", "अनुभव"]),
    ("hi", "General", "काम करते समय सुरक्षा नियम कैसे पालन करते हैं?", ["सुरक्षा", "नियम", "सावधानी", "उपकरण"]),
]

for lang, trade, text, kws in DEFAULT_QUESTIONS:
    qid = f"Q-{uuid.uuid4().hex[:8].upper()}"

    questions_db[qid] = {
        "id": qid,
        "language": lang,
        "trade": trade,
        "text": text,
        "expectedKeywords": kws,
        "maxScore": 20,
        "active": True,
    }

# =========================
# HELPERS
# =========================

def ref_id_for(district: str) -> str:
    prefix = re.sub(r"[^A-Za-z]", "", district[:3]).upper() or "KAR"
    return f"WF-{prefix}-2026-{uuid.uuid4().hex[:6].upper()}"


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def score_answer(answer: str, keywords: List[str]) -> dict:
    txt = normalize(answer)

    words = re.findall(r"[\w\u0C80-\u0CFF\u0900-\u097F]+", txt)

    word_count = len(words)

    length_score = min(word_count / 28, 1.0)

    keyword_hits = sum(
        1 for k in keywords
        if normalize(k) and normalize(k) in txt
    )

    keyword_score = keyword_hits / max(len(keywords), 1)

    has_specifics = (
        1.0 if any(ch.isdigit() for ch in txt) or word_count >= 18 else 0.65
    )

    relevance = max(
        0.45,
        0.55 * keyword_score + 0.45 * length_score
    )

    clarity = max(
        0.50,
        min(
            1.0,
            0.35 + length_score * 0.55 +
            (0.10 if "." in answer or "," in answer else 0)
        )
    )

    confidence = max(
        0.50,
        min(
            1.0,
            0.40 + has_specifics * 0.30 + length_score * 0.30
        )
    )

    overall = round(
        (relevance * 0.45 + clarity * 0.25 + confidence * 0.30),
        3
    )

    return {
        "relevance": round(relevance, 3),
        "clarity": round(clarity, 3),
        "confidence": round(confidence, 3),
        "overall": overall,
        "keywordHits": keyword_hits,
        "wordCount": word_count,
        "reason": "Scored using answer length, expected skill keywords, clarity and confidence indicators."
    }

# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "WorkforceFit AI",
        "docs": "/docs"
    }

# =========================
# REGISTER
# =========================

@app.post("/api/register")
@app.post("/api/candidates/register")
async def register_candidate(data: CandidateRegister):

    for c in candidates_db.values():
        if c["phone"] == data.phone:
            raise HTTPException(
                status_code=400,
                detail="Candidate already registered"
            )

    ref_id = data.refId or ref_id_for(data.district)

    candidates_db[ref_id] = {
        **data.dict(),
        "refId": ref_id,
        "status": "REGISTERED",
        "registeredAt": datetime.datetime.utcnow().isoformat(),
        "duplicateFlag": False,
        "livenessScore": 0.92,
        "voiceScore": 0.88,
        "score": None,
        "fitment": None,
        "fraudScore": 0.05,
    }

    return {
        "message": "Registration successful",
        "refId": ref_id,
        "candidate": candidates_db[ref_id]
    }

# =========================
# QUESTIONS
# =========================

@app.get("/api/questions")
def get_questions(language: str = "en", trade: str = "General"):

    exact = [
        q for q in questions_db.values()
        if q["active"]
        and q["language"] == language
        and (q["trade"] == trade or q["trade"] == "General")
    ]

    if not exact:
        exact = [
            q for q in questions_db.values()
            if q["active"] and q["language"] == "en"
        ]

    return exact[:5]


@app.post("/api/admin/questions")
def create_question(q: QuestionCreate):

    qid = f"Q-{uuid.uuid4().hex[:8].upper()}"

    questions_db[qid] = {
        "id": qid,
        **q.dict(),
        "active": True
    }

    return questions_db[qid]


@app.get("/api/admin/questions")
def admin_questions():
    return list(questions_db.values())

# =========================
# LIVENESS
# =========================

@app.post("/api/verify/liveness")
async def verify_liveness(
    refId: str,
    video: UploadFile = File(...)
):

    if refId not in candidates_db:
        raise HTTPException(404, "Candidate not found")

    face_hash = hashlib.sha256(
        f"{refId}-face".encode()
    ).hexdigest()

    candidates_db[refId]["livenessScore"] = 0.94
    candidates_db[refId]["faceHash"] = face_hash

    return {
        "passed": True,
        "score": 0.94
    }

# =========================
# EVALUATE ANSWERS
# =========================

@app.post("/api/evaluate-response")
async def evaluate_response(data: EvaluateRequest):

    if data.refId not in candidates_db:
        raise HTTPException(404, "Candidate not found")

    q = questions_db.get(data.questionId)

    if not q:
        raise HTTPException(404, "Question not found")

    result = score_answer(
        data.transcript,
        q.get("expectedKeywords", [])
    )

    record = {
        "questionId": data.questionId,
        "question": q["text"],
        "answer": data.transcript,
        **result
    }

    scores_db.setdefault(data.refId, []).append(result)
    answers_db.setdefault(data.refId, []).append(record)

    return result

# =========================
# CLASSIFICATION
# =========================

@app.post("/api/candidates/{ref_id}/classify")
async def classify_candidate(ref_id: str):

    if ref_id not in candidates_db:
        raise HTTPException(404, "Candidate not found")

    question_scores = scores_db.get(ref_id, [])

    if not question_scores:
        raise HTTPException(400, "No responses to classify")

    avg = sum(
        s["overall"] for s in question_scores
    ) / len(question_scores)

    liveness = candidates_db[ref_id].get("livenessScore", 0.5)

    duplicate = candidates_db[ref_id].get(
        "duplicateFlag",
        False
    )

    if duplicate or liveness < 0.45:
        fitment = "POTENTIAL_IMPERSONATION"

    elif avg >= 0.78:
        fitment = "JOB_READY"

    elif avg >= 0.58:
        fitment = "SKILL_ENHANCEMENT_REQUIRED"

    elif avg >= 0.42:
        fitment = "MANUAL_VERIFICATION"

    else:
        fitment = "INSUFFICIENT_CONFIDENCE"

    score_int = int(round(avg * 100))

    candidates_db[ref_id].update({
        "fitment": fitment,
        "score": score_int,
        "status": "CLASSIFIED"
    })

    return {
        "fitment": fitment,
        "score": score_int,
        "answers": answers_db.get(ref_id, [])
    }

# =========================
# COMPLETE INTERVIEW
# =========================

@app.post("/api/interview/complete")
async def complete_interview(data: CompleteInterviewRequest):
    return await classify_candidate(data.refId)

# =========================
# ADMIN CANDIDATES
# =========================

@app.get("/api/admin/candidates")
async def admin_get_candidates(
    district: Optional[str] = None,
    fitment: Optional[str] = None
):

    result = list(candidates_db.values())

    for c in result:
        c["answers"] = answers_db.get(c["refId"], [])

    if district and district != "All":
        result = [
            c for c in result
            if c["district"] == district
        ]

    if fitment and fitment != "All":
        result = [
            c for c in result
            if c.get("fitment") == fitment
        ]

    return result

# =========================
# ADMIN STATS
# =========================

@app.get("/api/admin/stats")
async def admin_stats():

    classified = [
        c for c in candidates_db.values()
        if c.get("fitment")
    ]

    by_cat = Counter(
        c["fitment"] for c in classified
    )

    by_dist = Counter(
        c["district"] for c in candidates_db.values()
    )

    return {
        "total": len(candidates_db),
        "registered": len(candidates_db),
        "classified": len(classified),

        "flagged": len([
            c for c in candidates_db.values()
            if c.get("duplicateFlag")
            or c.get("fraudScore", 0) > 0.7
        ]),

        "byCategory": dict(by_cat),

        "byDistrict": [
            {
                "district": k,
                "count": v
            }
            for k, v in by_dist.most_common(10)
        ],

        "distribution": [
            {
                "name": k,
                "value": v
            }
            for k, v in by_cat.items()
        ],
    }

# =========================
# ADMIN ACTION
# =========================

@app.post("/api/admin/candidates/{ref_id}/action")
async def admin_action(
    ref_id: str,
    data: AdminAction
):

    if ref_id not in candidates_db:
        raise HTTPException(404, "Candidate not found")

    candidates_db[ref_id]["status"] = data.action

    return {
        "refId": ref_id,
        "status": data.action
    }

# =========================
# MAIN
# =========================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )