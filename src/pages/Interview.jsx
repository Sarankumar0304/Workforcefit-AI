// src/pages/Interview.jsx
// WorkforceFit AI — AI-led Multilingual Video Interview Screen

import { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { startInterview, evaluateResponse, classifyFitment } from "../services/aiInterviewer";

const FACE_CHECK_INTERVAL = 2000; // ms

export default function Interview({ candidate, onComplete }) {
  const webcamRef = useRef(null);
  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState("ready"); // ready | verifying | interviewing | done
  const [question, setQuestion] = useState("");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [scores, setScores] = useState([]);
  const [faceOk, setFaceOk] = useState(true);
  const [alert, setAlert] = useState(null);
  const [progress, setProgress] = useState(0);
  const recognitionRef = useRef(null);

  // Start interview session
  async function beginInterview() {
    const s = await startInterview(candidate.refId, candidate.language);
    setSession(s);
    setQuestion(s.questions[0]);
    setPhase("interviewing");
    speak(s.questions[0], candidate.language);
  }

  // Text-to-speech for AI interviewer
  function speak(text, lang) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  // Start speech recognition
  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const r = new SpeechRecognition();
    r.lang = candidate.language === "kn" ? "kn-IN" : candidate.language === "hi" ? "hi-IN" : "en-IN";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(t);
    };
    r.start();
    recognitionRef.current = r;
    setIsRecording(true);
    setTranscript("");
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  async function submitResponse() {
    stopRecording();
    const score = await evaluateResponse(transcript, question, candidate.language);
    const newScores = [...scores, (score.relevance + score.clarity + score.confidence) / 3];
    setScores(newScores);

    const nextIdx = questionIdx + 1;
    setProgress(Math.round((nextIdx / session.questions.length) * 100));

    if (nextIdx < session.questions.length) {
      setQuestionIdx(nextIdx);
      setQuestion(session.questions[nextIdx]);
      setTranscript("");
      speak(session.questions[nextIdx], candidate.language);
    } else {
      // All questions answered
      const fitment = await classifyFitment(newScores);
      setPhase("done");
      onComplete({ candidate, scores: newScores, fitment, refId: candidate.refId });
    }
  }

  // Simulated face quality check
  useEffect(() => {
    if (phase !== "interviewing") return;
    const interval = setInterval(() => {
      // In production: run MediaPipe FaceMesh on webcam frame
      const ok = Math.random() > 0.05; // 95% face OK rate (demo)
      setFaceOk(ok);
      if (!ok) setAlert("⚠️ Face not clearly visible. Please adjust camera.");
      else setAlert(null);
    }, FACE_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className="interview-screen">
      {/* Face indicator */}
      <div className={`face-indicator ${faceOk ? "ok" : "warn"}`}>
        {faceOk ? "Face Detected" : "Adjust Camera"}
      </div>

      {/* Webcam */}
      <div className="cam-wrap">
        <Webcam ref={webcamRef} audio={false} mirrored={true}
          style={{ width: "100%", borderRadius: 12 }}/>
        {isRecording && <div className="rec-badge">● REC</div>}
        {alert && <div className="alert-banner">{alert}</div>}
      </div>

      {/* Progress bar */}
      {phase === "interviewing" && (
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${progress}%` }}/>
          <span>{questionIdx + 1} / {session?.questions.length} questions</span>
        </div>
      )}

      {/* Phase: Ready */}
      {phase === "ready" && (
        <div className="phase-panel">
          <h3>Ready to begin your interview?</h3>
          <p>The AI will ask you {5} questions in {candidate.language === "kn" ? "Kannada" : candidate.language === "hi" ? "Hindi" : "English"}.</p>
          <p>Speak clearly and take your time. There is no time limit per question.</p>
          <button className="btn-primary" onClick={beginInterview}>Start Interview →</button>
        </div>
      )}

      {/* Phase: Interviewing */}
      {phase === "interviewing" && session && (
        <div className="phase-panel">
          <div className="ai-avatar">AI Interviewer</div>
          <div className="question-box">{question}</div>
          <div className="transcript-box">{transcript || "Tap 'Start Speaking' when ready..."}</div>
          <div className="btn-row">
            {!isRecording
              ? <button className="btn-record" onClick={startRecording}>🎙 Start Speaking</button>
              : <button className="btn-stop" onClick={stopRecording}>⏹ Stop</button>
            }
            <button className="btn-submit" onClick={submitResponse} disabled={!transcript}>
              Submit Answer →
            </button>
          </div>
        </div>
      )}

      {/* Phase: Done */}
      {phase === "done" && (
        <div className="phase-panel success">
          <h3>Interview Complete!</h3>
          <p>Your responses are being analyzed. You will receive your results shortly.</p>
        </div>
      )}
    </div>
  );
}
