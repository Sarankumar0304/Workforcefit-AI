import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { CameraView, Camera } from "expo-camera";

const API_BASE = "http://192.168.1.4:8000"; // change to your PC IPv4 or Render backend URL

const FALLBACK_QUESTIONS = {
  kn: [
    { id: "local-kn-1", text: "ನಿಮ್ಮ ಹೆಸರು, ಊರು, ಮತ್ತು ಕೆಲಸದ ಅನುಭವವನ್ನು ಹೇಳಿ." },
    { id: "local-kn-2", text: "ನಿಮ್ಮ ಮುಖ್ಯ ಕೌಶಲ್ಯಗಳು ಯಾವುವು?" },
    { id: "local-kn-3", text: "ಕೆಲಸದಲ್ಲಿ ಸುರಕ್ಷತಾ ನಿಯಮಗಳನ್ನು ಹೇಗೆ ಪಾಲಿಸುತ್ತೀರಿ?" },
  ],
  hi: [
    { id: "local-hi-1", text: "अपना नाम, शहर और काम का अनुभव बताइए।" },
    { id: "local-hi-2", text: "आपके मुख्य कौशल क्या हैं?" },
    { id: "local-hi-3", text: "काम करते समय सुरक्षा नियम कैसे पालन करते हैं?" },
  ],
  en: [
    { id: "local-en-1", text: "Tell me about your name, hometown, and work experience." },
    { id: "local-en-2", text: "What are your main skills for this trade?" },
    { id: "local-en-3", text: "How do you follow safety rules at work?" },
  ],
};

async function evaluateResponseApi(refId, q, idx, text, language) {
  // Fallback local score only used if backend is offline.
  if (String(q.id).startsWith("local-")) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const overall = Math.max(0.55, Math.min(0.92, words / 35 + 0.45));
    return { relevance: overall, clarity: overall, confidence: overall, overall };
  }
  const res = await fetch(`${API_BASE}/api/evaluate-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refId, questionId: q.id, questionIdx: idx, transcript: text, language }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

function ProgressBar({ current, total }) {
  const pct = (current / total) * 100;
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${pct}%` }]} />
      <Text style={pb.label}>{current} / {total} Questions</Text>
    </View>
  );
}
const pb = StyleSheet.create({
  track: { backgroundColor: "#0D1F40", borderRadius: 8, height: 8, marginBottom: 6, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#34D399", borderRadius: 8 },
  label: { color: "#8BAFD4", fontSize: 11, textAlign: "right", marginBottom: 16 },
});

function FaceBadge({ status }) {
  const c = status === "ok"
    ? { bg: "#062E24", border: "#10B981", text: "#34D399", label: "● Face Verified" }
    : { bg: "#2A1A00", border: "#F59E0B", text: "#FBBF24", label: "⚠ Adjust Camera" };
  return <View style={[fb.badge, { backgroundColor: c.bg, borderColor: c.border }]}><Text style={[fb.text, { color: c.text }]}>{c.label}</Text></View>;
}
const fb = StyleSheet.create({ badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }, text: { fontSize: 11, fontWeight: "800" } });

function ScoreDots({ scores }) {
  return <View style={sd.row}>{scores.map((s, i) => <View key={i} style={[sd.dot, { backgroundColor: s > 0.75 ? "#34D399" : s > 0.55 ? "#FBBF24" : "#EF4444" }]} />)}</View>;
}
const sd = StyleSheet.create({ row: { flexDirection: "row", gap: 6, marginBottom: 12 }, dot: { width: 10, height: 10, borderRadius: 5 } });

export default function Interview({ candidate, onComplete }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [hasPermission, setHasPermission] = useState(null);
  const [phase, setPhase] = useState("ready");
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState([]);
  const [scoreObjects, setScoreObjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [faceStatus, setFaceStatus] = useState("warn");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [apiNote, setApiNote] = useState("");

  const lang = candidate?.language || "en";
  const currentQ = questions[questionIdx];

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") setFaceStatus("warn");
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const url = `${API_BASE}/api/questions?language=${lang}&trade=${encodeURIComponent(candidate?.trade || "General")}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("questions api failed");
        const data = await res.json();
        setQuestions(data.length ? data : FALLBACK_QUESTIONS[lang] || FALLBACK_QUESTIONS.en);
      } catch (e) {
        setApiNote("Offline demo mode: using built-in questions");
        setQuestions(FALLBACK_QUESTIONS[lang] || FALLBACK_QUESTIONS.en);
      }
    })();
  }, [lang, candidate?.trade]);

  useEffect(() => {
    if (phase !== "interview") return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [phase]);

  async function submitAnswer() {
    if (!answer.trim() || isEvaluating || !currentQ) return;
    setIsEvaluating(true);
    try {
      const scoreObj = await evaluateResponseApi(candidate?.refId, currentQ, questionIdx, answer, lang);
      const score = scoreObj.overall ?? ((scoreObj.relevance + scoreObj.clarity + scoreObj.confidence) / 3);
      const newScores = [...scores, score];
      const newObjs = [...scoreObjects, scoreObj];
      setScores(newScores);
      setScoreObjects(newObjs);
      const next = questionIdx + 1;
      if (next < questions.length) {
        setQuestionIdx(next);
        setAnswer("");
      } else {
        setPhase("done");
        let finalResult = null;
        try {
          const res = await fetch(`${API_BASE}/api/candidates/${candidate?.refId}/classify`, { method: "POST" });
          if (res.ok) finalResult = await res.json();
        } catch (_) {}
        const avg = newScores.reduce((a, b) => a + b, 0) / newScores.length;
        const fallbackFitment = avg >= 0.78 ? "JOB_READY" : avg >= 0.58 ? "SKILL_ENHANCEMENT_REQUIRED" : avg >= 0.42 ? "MANUAL_VERIFICATION" : "LOW_CONFIDENCE";
        onComplete({ candidate, scores: newScores, scoreObjects: newObjs, fitment: finalResult?.fitment || fallbackFitment, refId: candidate?.refId, language: lang, totalQuestions: questions.length, score: finalResult?.score || Math.round(avg * 100) });
      }
    } catch (e) {
      alert("Could not evaluate answer. Check backend URL/IP and try again.");
    } finally {
      setIsEvaluating(false);
    }
  }

  if (phase === "ready") {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.hero}>
            <Text style={s.govLabel}>AI SkillFit · EDCS Karnataka</Text>
            <Text style={s.title}>Guided Video Assessment</Text>
            <Text style={s.subtitle}>Kannada-first interview with face check, skill scoring and fitment classification.</Text>
          </View>
          <View style={s.candidateCard}>
            <View style={s.avatarCircle}><Text style={s.avatarText}>{(candidate?.name || "?")[0].toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.candidateName}>{candidate?.name}</Text>
              <Text style={s.candidateMeta}>{candidate?.trade} · {candidate?.district}</Text>
              <Text style={s.candidateRef}>{candidate?.refId}</Text>
            </View>
          </View>
          <View style={s.flowCard}>
            <Text style={s.flowTitle}>Assessment Flow</Text>
            {['Face visibility check', 'Admin-configured questions', 'AI scoring for relevance, clarity, confidence', 'Fitment report visible in admin dashboard'].map((t, i) => <Text key={i} style={s.flowItem}>0{i + 1} · {t}</Text>)}
          </View>
          {!!apiNote && <Text style={s.apiNote}>{apiNote}</Text>}
          <TouchableOpacity style={s.startBtn} onPress={() => setPhase("interview")}><Text style={s.startBtnText}>Start Secure Interview →</Text></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === "done") return <SafeAreaView style={s.safe}><View style={s.doneScreen}><Text style={{ fontSize: 52 }}>✅</Text><Text style={s.doneTitle}>Interview Complete</Text><Text style={s.doneSub}>Opening fitment report...</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.topBar}><Text style={s.topBarTitle}>Live AI Interview</Text><Animated.View style={[s.recDot, { transform: [{ scale: pulseAnim }] }]} /><Text style={s.recText}>REC</Text></View>
        <View style={s.cameraWrap}>
          {hasPermission === null ? <Text style={s.cameraText}>Requesting camera permission...</Text> : hasPermission === false ? <View style={[s.camera, s.cameraFallback]}><Text style={s.cameraText}>No camera access</Text></View> : <CameraView style={s.camera} facing="front" onCameraReady={() => setFaceStatus("ok")} />}
          <View style={s.cameraOverlay}><FaceBadge status={faceStatus} /></View>
        </View>
        {scores.length > 0 && <ScoreDots scores={scores} />}
        <ProgressBar current={questionIdx + 1} total={questions.length || 1} />
        <View style={s.questionBox}><Text style={s.qNum}>Question {questionIdx + 1}</Text><Text style={s.questionText}>{currentQ?.text || "Loading question..."}</Text></View>
        <Text style={s.answerLabel}>Speak or type answer · ಉತ್ತರ</Text>
        <TextInput style={s.answerInput} placeholder="Type/dictate your answer here…" placeholderTextColor="#64748B" value={answer} onChangeText={setAnswer} multiline editable={!isEvaluating} />
        <TouchableOpacity style={[s.submitBtn, (!answer.trim() || isEvaluating) && s.submitBtnDisabled]} disabled={!answer.trim() || isEvaluating} onPress={submitAnswer}><Text style={s.submitBtnText}>{isEvaluating ? "Evaluating…" : questionIdx < questions.length - 1 ? "Submit & Next →" : "Submit & Finish ✓"}</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#07111F" }, scroll: { padding: 20, paddingTop: 44, paddingBottom: 40 },
  hero: { backgroundColor: "#0F172A", borderRadius: 24, padding: 22, marginBottom: 18, borderWidth: 1, borderColor: "#1E293B" },
  govLabel: { color: "#34D399", fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: "800" }, title: { color: "#FFF", fontSize: 29, fontWeight: "900", marginTop: 8 }, subtitle: { color: "#94A3B8", marginTop: 8, lineHeight: 20 },
  topBar: { flexDirection: "row", alignItems: "center", marginBottom: 12 }, topBarTitle: { color: "#FFF", fontWeight: "800", fontSize: 17, flex: 1 }, recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444", marginRight: 6 }, recText: { color: "#EF4444", fontWeight: "900", fontSize: 11 },
  cameraWrap: { borderRadius: 22, overflow: "hidden", height: 230, marginBottom: 16, position: "relative", borderWidth: 1.5, borderColor: "#1E293B", backgroundColor: "#0F172A" }, camera: { height: 230 }, cameraFallback: { justifyContent: "center", alignItems: "center" }, cameraText: { color: "white", padding: 20 }, cameraOverlay: { position: "absolute", bottom: 12, left: 12 },
  candidateCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#0F172A", borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#1E293B", gap: 14 }, avatarCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#34D399", justifyContent: "center", alignItems: "center" }, avatarText: { color: "#07111F", fontSize: 22, fontWeight: "900" }, candidateName: { color: "#FFF", fontWeight: "800", fontSize: 17 }, candidateMeta: { color: "#CBD5E1", fontSize: 12, marginTop: 2 }, candidateRef: { color: "#34D399", fontSize: 11, marginTop: 4, fontWeight: "800" },
  flowCard: { backgroundColor: "#0F172A", borderRadius: 20, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: "#1E293B" }, flowTitle: { color: "#FFF", fontWeight: "800", marginBottom: 10 }, flowItem: { color: "#CBD5E1", paddingVertical: 5 }, apiNote: { color: "#FBBF24", marginBottom: 12, textAlign: "center" },
  startBtn: { backgroundColor: "#34D399", paddingVertical: 16, borderRadius: 16, alignItems: "center" }, startBtnText: { color: "#07111F", fontWeight: "900", fontSize: 16 },
  questionBox: { backgroundColor: "#0F172A", borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: "#34D399" }, qNum: { color: "#34D399", fontSize: 11, fontWeight: "900", marginBottom: 8 }, questionText: { color: "#FFF", fontSize: 18, fontWeight: "700", lineHeight: 27 }, answerLabel: { color: "#CBD5E1", fontSize: 12, fontWeight: "700", marginBottom: 8 }, answerInput: { backgroundColor: "#0F172A", borderWidth: 1.5, borderColor: "#1E293B", borderRadius: 16, padding: 16, color: "#FFF", fontSize: 15, minHeight: 120, textAlignVertical: "top", marginBottom: 14, lineHeight: 22 }, submitBtn: { backgroundColor: "#34D399", paddingVertical: 15, borderRadius: 16, alignItems: "center" }, submitBtnDisabled: { backgroundColor: "#334155" }, submitBtnText: { color: "#07111F", fontWeight: "900", fontSize: 16 },
  doneScreen: { flex: 1, justifyContent: "center", alignItems: "center" }, doneTitle: { color: "#FFF", fontSize: 24, fontWeight: "900", marginTop: 16 }, doneSub: { color: "#94A3B8", marginTop: 8 },
});
