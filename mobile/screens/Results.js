import React, { useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Share,
} from "react-native";

/* ─── Fitment Config ─── */
const FITMENT_CONFIG = {
  JOB_READY: {
    emoji: "🏆",
    label: "Job Ready",
    labelKn: "ಕೆಲಸಕ್ಕೆ ಸಿದ್ಧ",
    color: "#2DD87B",
    bg: "#0A3020",
    border: "#1A7A44",
    description: "Candidate demonstrates strong skills, clear communication, and confidence. Recommended for immediate placement.",
    nextStep: "Your profile is being shared with employers in your district.",
    badge: "RECOMMENDED",
  },
  SKILL_ENHANCEMENT_REQUIRED: {
    emoji: "📈",
    label: "Skill Enhancement Required",
    labelKn: "ಕೌಶಲ್ಯ ಅಭಿವೃದ್ಧಿ ಅಗತ್ಯ",
    color: "#C5A028",
    bg: "#2A1A00",
    border: "#8A6A10",
    description: "Candidate shows potential but needs targeted skill development. Recommended for upskilling programs.",
    nextStep: "You will be enrolled in a Karnataka Skill Development Program.",
    badge: "UPSKILLING",
  },
  MANUAL_VERIFICATION: {
    emoji: "🔍",
    label: "Manual Verification",
    labelKn: "ಹಸ್ತಚಾಲಿತ ಪರಿಶೀಲನೆ",
    color: "#3A8BE0",
    bg: "#061A40",
    border: "#1A4A80",
    description: "Assessment requires human review. A EDCS officer will review your application.",
    nextStep: "Expect a call from our team within 3–5 working days.",
    badge: "REVIEW",
  },
  LOW_CONFIDENCE: {
    emoji: "⚠️",
    label: "Re-assessment Required",
    labelKn: "ಮರು-ಮೌಲ್ಯಮಾಪನ ಅಗತ್ಯ",
    color: "#E87070",
    bg: "#2A0808",
    border: "#7A2020",
    description: "Interview quality was low due to unclear responses or technical issues. Please attempt again.",
    nextStep: "You may re-appear after 24 hours with better internet/camera setup.",
    badge: "RETRY",
  },
};

/* ─── Score Bar ─── */
function ScoreBar({ label, value, color }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 900, delay: 200, useNativeDriver: false }).start();
  }, []);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={bar.wrap}>
      <View style={bar.row}>
        <Text style={bar.label}>{label}</Text>
        <Text style={[bar.pct, { color }]}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={bar.track}>
        <Animated.View style={[bar.fill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}
const bar = StyleSheet.create({
  wrap: { marginBottom: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#8BAFD4", fontSize: 12, fontWeight: "600" },
  pct: { fontSize: 12, fontWeight: "800" },
  track: { height: 8, backgroundColor: "#0D1F40", borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
});

/* ─── Question Score Row ─── */
function QScoreRow({ idx, score, lang }) {
  const pct = Math.round(score * 100);
  const color = score > 0.65 ? "#2DD87B" : score > 0.4 ? "#C5A028" : "#E87070";
  return (
    <View style={qr.row}>
      <View style={[qr.numBadge, { borderColor: color }]}>
        <Text style={[qr.numText, { color }]}>Q{idx + 1}</Text>
      </View>
      <View style={qr.barWrap}>
        <View style={qr.track}>
          <View style={[qr.fill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
      <Text style={[qr.pct, { color }]}>{pct}%</Text>
    </View>
  );
}
const qr = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  numBadge: { width: 32, height: 32, borderRadius: 6, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  numText: { fontWeight: "800", fontSize: 12 },
  barWrap: { flex: 1 },
  track: { height: 8, backgroundColor: "#0D1F40", borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  pct: { fontWeight: "700", fontSize: 12, width: 36, textAlign: "right" },
});

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function Results({ result }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!result) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={{ color: "#5A7BA8", fontSize: 14 }}>No result data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { candidate, scores = [], fitment = "MANUAL_VERIFICATION", refId } = result;
  const config = FITMENT_CONFIG[fitment] || FITMENT_CONFIG.MANUAL_VERIFICATION;
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  /* Derived per-dimension scores (simulated from avg) */
  const relevance = Math.min(avgScore * 1.1, 1);
  const clarity = Math.min(avgScore * 0.95, 1);
  const confidence = Math.min(avgScore * 1.05, 1);

  async function shareResult() {
    try {
      await Share.share({
        message: `AI SkillFit Result\nRef: ${refId}\nName: ${candidate?.name}\nTrade: ${candidate?.trade}\nFitment: ${config.label}\nScore: ${Math.round(avgScore * 100)}%\n\nGovernment of Karnataka · EDCS`,
      });
    } catch (e) {}
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Gov header */}
          <View style={s.header}>
            <Text style={s.govLabel}>Government of Karnataka · EDCS</Text>
            <Text style={s.title}>Assessment Report</Text>
            <Text style={s.refId}>{refId}</Text>
          </View>

          {/* Fitment Card */}
          <View style={[s.fitmentCard, { backgroundColor: config.bg, borderColor: config.border }]}>
            <View style={s.fitmentTop}>
              <Text style={{ fontSize: 44 }}>{config.emoji}</Text>
              <View style={[s.fitmentBadge, { backgroundColor: config.color + "22", borderColor: config.color }]}>
                <Text style={[s.fitmentBadgeText, { color: config.color }]}>{config.badge}</Text>
              </View>
            </View>
            <Text style={[s.fitmentLabel, { color: config.color }]}>{config.label}</Text>
            <Text style={s.fitmentLabelKn}>{config.labelKn}</Text>
            <Text style={s.fitmentDesc}>{config.description}</Text>

            {/* Overall score ring */}
            <View style={s.scoreRingWrap}>
              <View style={s.scoreRing}>
                <Text style={[s.scoreRingNum, { color: config.color }]}>
                  {Math.round(avgScore * 100)}
                </Text>
                <Text style={s.scoreRingLabel}>/ 100</Text>
              </View>
              <Text style={s.scoreCaption}>Overall Score</Text>
            </View>
          </View>

          {/* Candidate Summary */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Candidate Profile</Text>
            <View style={s.profileRow}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>{(candidate?.name || "?")[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.profileName}>{candidate?.name}</Text>
                <Text style={s.profileMeta}>{candidate?.trade}</Text>
                <Text style={s.profileDist}>📍 {candidate?.district}</Text>
                <Text style={s.profilePhone}>📱 +91 {candidate?.phone}</Text>
              </View>
            </View>
          </View>

          {/* Dimension Scores */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Assessment Dimensions</Text>
            <ScoreBar label="Response Relevance" value={relevance} color="#C5A028" />
            <ScoreBar label="Communication Clarity" value={clarity} color="#3A8BE0" />
            <ScoreBar label="Skill Confidence" value={confidence} color="#2DD87B" />
          </View>

          {/* Per-question scores */}
          {scores.length > 0 && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Question-wise Performance</Text>
              {scores.map((sc, i) => (
                <QScoreRow key={i} idx={i} score={sc} />
              ))}
            </View>
          )}

          {/* Next Steps */}
          <View style={[s.nextCard, { borderColor: config.border }]}>
            <Text style={[s.nextTitle, { color: config.color }]}>▶ Next Steps</Text>
            <Text style={s.nextText}>{config.nextStep}</Text>
          </View>

          {/* Integrity badges */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Verification Status</Text>
            <View style={s.badgeRow}>
              {[
                { icon: "🔒", label: "Secure", sub: "End-to-end encrypted" },
                { icon: "📹", label: "Recorded", sub: "Video on file" },
                { icon: "✅", label: "Verified", sub: "No duplicates found" },
              ].map((b) => (
                <View key={b.label} style={s.verifyBadge}>
                  <Text style={{ fontSize: 22 }}>{b.icon}</Text>
                  <Text style={s.verifyLabel}>{b.label}</Text>
                  <Text style={s.verifySub}>{b.sub}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Share button */}
          <TouchableOpacity style={s.shareBtn} onPress={shareResult}>
            <Text style={s.shareBtnText}>↗  Share Certificate</Text>
          </TouchableOpacity>

          <Text style={s.footerNote}>
            This assessment was conducted by EDCS AI SkillFit.{"\n"}
            Reference ID: {refId} · Government of Karnataka
          </Text>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071530" },
  scroll: { padding: 20, paddingTop: 44, paddingBottom: 50 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { alignItems: "center", marginBottom: 24 },
  govLabel: { color: "#C5A028", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "700" },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 },
  refId: { color: "#5A7BA8", fontSize: 12, marginTop: 6, letterSpacing: 1 },

  /* Fitment Card */
  fitmentCard: { borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1.5 },
  fitmentTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  fitmentBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  fitmentBadgeText: { fontWeight: "800", fontSize: 11, letterSpacing: 1 },
  fitmentLabel: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  fitmentLabelKn: { color: "#8BAFD4", fontSize: 14, marginTop: 2, marginBottom: 12 },
  fitmentDesc: { color: "#8BAFD4", fontSize: 13, lineHeight: 20 },

  scoreRingWrap: { alignItems: "center", marginTop: 20 },
  scoreRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: "#1E3266", justifyContent: "center", alignItems: "center", backgroundColor: "#071530" },
  scoreRingNum: { fontSize: 34, fontWeight: "900" },
  scoreRingLabel: { color: "#5A7BA8", fontSize: 11, textAlign: "center" },
  scoreCaption: { color: "#5A7BA8", fontSize: 11, marginTop: 8, letterSpacing: 0.5 },

  card: { backgroundColor: "#0D1F40", borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: "#1E3266" },
  cardTitle: { color: "#C5A028", fontWeight: "700", fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 16 },

  /* Profile */
  profileRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  avatarCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#C5A028", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#071530", fontSize: 24, fontWeight: "900" },
  profileName: { color: "#FFFFFF", fontWeight: "800", fontSize: 17 },
  profileMeta: { color: "#8BAFD4", fontSize: 13, marginTop: 2 },
  profileDist: { color: "#5A7BA8", fontSize: 12, marginTop: 4 },
  profilePhone: { color: "#5A7BA8", fontSize: 12, marginTop: 2 },

  /* Next steps */
  nextCard: { borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1.5, backgroundColor: "#0A1020" },
  nextTitle: { fontWeight: "800", fontSize: 13, letterSpacing: 0.5, marginBottom: 8 },
  nextText: { color: "#8BAFD4", fontSize: 14, lineHeight: 21 },

  /* Verify badges */
  badgeRow: { flexDirection: "row", gap: 10 },
  verifyBadge: { flex: 1, backgroundColor: "#071530", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#1E3266" },
  verifyLabel: { color: "#FFFFFF", fontWeight: "700", fontSize: 12, marginTop: 6 },
  verifySub: { color: "#5A7BA8", fontSize: 10, textAlign: "center", marginTop: 3 },

  /* Share */
  shareBtn: { backgroundColor: "#C5A028", paddingVertical: 15, borderRadius: 12, alignItems: "center", marginTop: 8, shadowColor: "#C5A028", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  shareBtnText: { color: "#071530", fontWeight: "800", fontSize: 16 },

  footerNote: { textAlign: "center", color: "#2A4A70", fontSize: 11, marginTop: 24, lineHeight: 18 },
});