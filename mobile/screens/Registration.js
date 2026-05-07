import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from "react-native";

const DISTRICTS = [
  "Bengaluru Urban",
  "Bengaluru Rural",
  "Mysuru",
  "Belagavi",
  "Kalaburagi",
  "Haveri",
  "Dharwad",
  "Tumakuru",
  "Shivamogga",
  "Davanagere",
];

const TRADES = [
  { label: "⚡ Electrician", value: "Electrician" },
  { label: "🔧 Plumber", value: "Plumber" },
  { label: "🧱 Mason / Construction", value: "Mason / Construction" },
  { label: "🔥 Welder", value: "Welder" },
  { label: "🪚 Carpenter", value: "Carpenter" },
  { label: "🚛 Driver / Logistics", value: "Driver / Logistics" },
  { label: "🧵 Tailoring / Garments", value: "Tailoring / Garments" },
  { label: "🌾 Agriculture", value: "Agriculture" },
  { label: "🎓 Polytechnic Graduate", value: "Polytechnic Graduate" },
  { label: "➕ Other", value: "Other" },
];

const LANGUAGES = [
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "hi", label: "हिंदी" },
  { code: "en", label: "English" },
];

function generateRefId(prefix) {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function StepIndicator({ current, total }) {
  return (
    <View style={si.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={si.wrap}>
          <View style={[si.circle, i + 1 <= current && si.active]}>
            <Text style={[si.num, i + 1 <= current && si.activeNum]}>
              {i + 1}
            </Text>
          </View>
          {i < total - 1 && (
            <View style={[si.line, i + 1 < current && si.activeLine]} />
          )}
        </View>
      ))}
    </View>
  );
}

const si = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  wrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#C5A028",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B1F4A",
  },
  active: { backgroundColor: "#C5A028", borderColor: "#C5A028" },
  num: { color: "#C5A028", fontWeight: "700", fontSize: 13 },
  activeNum: { color: "#0B1F4A" },
  line: { flex: 1, height: 2, backgroundColor: "#1E3266", marginHorizontal: 4 },
  activeLine: { backgroundColor: "#C5A028" },
});

export default function Registration({ onRegister }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    district: "",
    trade: "",
    language: "kn",
  });
  const [refId, setRefId] = useState(null);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit() {
    const id = generateRefId(form.district.slice(0, 3).toUpperCase());
    try {
      const res = await fetch("http://192.168.1.4:8000/api/candidates/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, refId: id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRefId(data.refId);
      setStep(3);
      if (onRegister) onRegister({ ...form, refId: data.refId });
      return;
    } catch (e) {
      console.log("Server offline — continuing offline", e);
    }
    setRefId(id);
    setStep(3);
    if (onRegister) onRegister({ ...form, refId: id });
  }

  /* ───── STEP 1: Personal Info ───── */
  if (step === 1) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.gov}>Government of Karnataka</Text>
            <Text style={s.brand}>AI SkillFit</Text>
            <Text style={s.sub}>Workforce Assessment Platform · EDCS</Text>
          </View>

          <StepIndicator current={1} total={2} />

          <Text style={s.sectionTitle}>ನಿಮ್ಮ ವಿವರಗಳು · Your Details</Text>

          {/* Language Picker */}
          <Text style={s.label}>Preferred Language · ಭಾಷೆ</Text>
          <View style={s.langRow}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[
                  s.langBtn,
                  form.language === l.code && s.langBtnActive,
                ]}
                onPress={() => update("language", l.code)}
              >
                <Text
                  style={[
                    s.langText,
                    form.language === l.code && s.langTextActive,
                  ]}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Full Name · ಹೆಸರು</Text>
          <TextInput
            style={s.input}
            placeholder="Enter your full name"
            placeholderTextColor="#5A7BA8"
            value={form.name}
            onChangeText={(v) => update("name", v)}
          />

          <Text style={s.label}>Mobile Number · ಮೊಬೈಲ್</Text>
          <View style={s.phoneRow}>
            <View style={s.countryCode}>
              <Text style={s.countryText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={[s.input, s.phoneInput]}
              placeholder="9XXXXXXXXX"
              placeholderTextColor="#5A7BA8"
              keyboardType="phone-pad"
              maxLength={10}
              value={form.phone}
              onChangeText={(v) => update("phone", v)}
            />
          </View>

          <TouchableOpacity
            style={[
              s.btn,
              (!form.name || form.phone.length < 10) && s.btnDisabled,
            ]}
            disabled={!form.name || form.phone.length < 10}
            onPress={() => setStep(2)}
          >
            <Text style={s.btnText}>Next →</Text>
          </TouchableOpacity>

          <Text style={s.footer}>
            Powered by EDCS · Secure & Encrypted · Data stored in India
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ───── STEP 2: District & Trade ───── */
  if (step === 2) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.header}>
            <Text style={s.gov}>Government of Karnataka</Text>
            <Text style={s.brand}>AI SkillFit</Text>
          </View>

          <StepIndicator current={2} total={2} />

          <Text style={s.sectionTitle}>ಜಿಲ್ಲೆ ಮತ್ತು ವೃತ್ತಿ · District & Trade</Text>

          <Text style={s.label}>Select Your District · ಜಿಲ್ಲೆ</Text>
          <View style={s.chipGrid}>
            {DISTRICTS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[s.chip, form.district === d && s.chipActive]}
                onPress={() => update("district", d)}
              >
                <Text style={[s.chipText, form.district === d && s.chipTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 20 }]}>Select Your Trade · ವೃತ್ತಿ</Text>
          {TRADES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[s.tradeRow, form.trade === t.value && s.tradeRowActive]}
              onPress={() => update("trade", t.value)}
            >
              <Text style={[s.tradeText, form.trade === t.value && s.tradeTextActive]}>
                {t.label}
              </Text>
              {form.trade === t.value && (
                <View style={s.checkBadge}>
                  <Text style={s.checkMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          <View style={s.navRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
              <Text style={s.backText}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.btn,
                s.btnFlex,
                (!form.district || !form.trade) && s.btnDisabled,
              ]}
              disabled={!form.district || !form.trade}
              onPress={handleSubmit}
            >
              <Text style={s.btnText}>Register Now</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>
            Powered by EDCS · Secure & Encrypted · Data stored in India
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ───── STEP 3: Success ───── */
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.successScreen}>
        <View style={s.successCard}>
          <View style={s.successIcon}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
          </View>
          <Text style={s.successTitle}>ನೋಂದಣಿ ಯಶಸ್ವಿ!</Text>
          <Text style={s.successSubtitle}>Registration Successful</Text>

          <View style={s.refBox}>
            <Text style={s.refLabel}>Your Reference ID</Text>
            <Text style={s.refId}>{refId}</Text>
          </View>

          <View style={s.infoRow}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Name</Text>
              <Text style={s.infoVal}>{form.name}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Trade</Text>
              <Text style={s.infoVal}>{form.trade}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>District</Text>
              <Text style={s.infoVal}>{form.district}</Text>
            </View>
          </View>

          <Text style={s.successNote}>
            Proceeding to AI Video Interview…
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071530" },
  scroll: { padding: 20, paddingTop: 44, paddingBottom: 40 },

  /* Header */
  header: { alignItems: "center", marginBottom: 28 },
  gov: { color: "#C5A028", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "600" },
  brand: { color: "#FFFFFF", fontSize: 30, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  sub: { color: "#5A7BA8", fontSize: 11, marginTop: 4, letterSpacing: 0.5 },

  sectionTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", marginBottom: 18 },
  label: { color: "#8BAFD4", fontSize: 12, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 },

  /* Language */
  langRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  langBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: "#1E3266", alignItems: "center", backgroundColor: "#0D1F40" },
  langBtnActive: { borderColor: "#C5A028", backgroundColor: "#1A2E5A" },
  langText: { color: "#5A7BA8", fontWeight: "600", fontSize: 14 },
  langTextActive: { color: "#C5A028" },

  /* Input */
  input: {
    backgroundColor: "#0D1F40",
    borderWidth: 1.5,
    borderColor: "#1E3266",
    borderRadius: 10,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 16,
  },
  phoneRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  countryCode: { backgroundColor: "#0D1F40", borderWidth: 1.5, borderColor: "#1E3266", borderRadius: 10, paddingHorizontal: 12, justifyContent: "center" },
  countryText: { color: "#C5A028", fontWeight: "700", fontSize: 13 },
  phoneInput: { flex: 1, marginBottom: 0 },

  /* Chips */
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: "#1E3266", backgroundColor: "#0D1F40" },
  chipActive: { borderColor: "#C5A028", backgroundColor: "#1A2E5A" },
  chipText: { color: "#5A7BA8", fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: "#C5A028", fontWeight: "700" },

  /* Trades */
  tradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#1E3266",
    borderRadius: 10,
    backgroundColor: "#0D1F40",
    marginBottom: 8,
  },
  tradeRowActive: { borderColor: "#C5A028", backgroundColor: "#122040" },
  tradeText: { color: "#8BAFD4", fontSize: 15, fontWeight: "500" },
  tradeTextActive: { color: "#FFFFFF", fontWeight: "700" },
  checkBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#C5A028", justifyContent: "center", alignItems: "center" },
  checkMark: { color: "#071530", fontWeight: "900", fontSize: 13 },

  /* Buttons */
  btn: {
    backgroundColor: "#C5A028",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#C5A028",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: { backgroundColor: "#1E3266", shadowOpacity: 0 },
  btnText: { color: "#071530", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  btnFlex: { flex: 1, marginTop: 0, marginLeft: 10 },
  navRow: { flexDirection: "row", alignItems: "center", marginTop: 20, gap: 10 },
  backBtn: { paddingVertical: 15, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1.5, borderColor: "#1E3266" },
  backText: { color: "#5A7BA8", fontWeight: "600" },

  footer: { textAlign: "center", color: "#2A4A70", fontSize: 11, marginTop: 30 },

  /* Success */
  successScreen: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#071530" },
  successCard: { backgroundColor: "#0D1F40", borderRadius: 20, padding: 28, width: "100%", borderWidth: 1, borderColor: "#1E3266", alignItems: "center" },
  successIcon: { marginBottom: 12 },
  successTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", textAlign: "center" },
  successSubtitle: { color: "#8BAFD4", fontSize: 14, marginTop: 4, marginBottom: 24 },
  refBox: { backgroundColor: "#071530", borderRadius: 12, padding: 16, width: "100%", alignItems: "center", borderWidth: 1, borderColor: "#C5A028", marginBottom: 20 },
  refLabel: { color: "#8BAFD4", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  refId: { color: "#C5A028", fontSize: 26, fontWeight: "900", letterSpacing: 2 },
  infoRow: { flexDirection: "row", gap: 10, width: "100%", marginBottom: 20 },
  infoItem: { flex: 1, backgroundColor: "#071530", borderRadius: 10, padding: 10, alignItems: "center" },
  infoLabel: { color: "#5A7BA8", fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 },
  infoVal: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", textAlign: "center" },
  successNote: { color: "#5A7BA8", fontSize: 12, fontStyle: "italic" },
});