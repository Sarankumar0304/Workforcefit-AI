// src/pages/Registration.jsx
// WorkforceFit AI - Candidate Registration Screen

import { useState } from "react";
import { generateRefId } from "../services/aiInterviewer";

const DISTRICTS = [
  "Bengaluru Urban","Bengaluru Rural","Mysuru","Belagavi","Kalaburagi",
  "Haveri","Dharwad","Tumakuru","Shivamogga","Davanagere"
];

const TRADES = [
  "Electrician","Plumber","Mason / Construction","Welder",
  "Carpenter","Driver / Logistics","Tailoring / Garments","Agriculture",
  "Polytechnic Graduate","Other"
];

const LANGUAGES = [
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "en", label: "English" }
];

export default function Registration({ onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", phone: "", district: "", trade: "", language: "kn", resume: null
  });
  const [refId, setRefId] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    setLoading(true);
    // Generate unique Ref-ID
    const id = generateRefId(form.district.slice(0, 3).toUpperCase());
    // POST to backend
    await fetch("/api/candidates/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, refId: id })
    });
    setRefId(id);
    setLoading(false);
    setStep(3);
  }

  if (step === 1) return (
    <div className="screen">
      <h2>ನಮಸ್ಕಾರ! Welcome to WorkforceFit AI</h2>
      <p>Let's get you registered. This takes 2 minutes.</p>
      <div className="form-group">
        <label>Full Name</label>
        <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Enter your full name"/>
      </div>
      <div className="form-group">
        <label>Mobile Number</label>
        <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 XXXXX XXXXX"/>
      </div>
      <div className="form-group">
        <label>Preferred Language for Interview</label>
        <div className="lang-select">
          {LANGUAGES.map(l => (
            <button key={l.code} className={form.language === l.code ? "active" : ""}
              onClick={() => update("language", l.code)}>{l.label}</button>
          ))}
        </div>
      </div>
      <button className="btn-primary" onClick={() => setStep(2)} disabled={!form.name || !form.phone}>
        Next →
      </button>
    </div>
  );

  if (step === 2) return (
    <div className="screen">
      <h2>Your Background</h2>
      <div className="form-group">
        <label>District</label>
        <select value={form.district} onChange={e => update("district", e.target.value)}>
          <option value="">Select district...</option>
          {DISTRICTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Trade / Skill Area</label>
        <select value={form.trade} onChange={e => update("trade", e.target.value)}>
          <option value="">Select your trade...</option>
          {TRADES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Resume (optional)</label>
        <input type="file" accept=".pdf,.doc,.docx"
          onChange={e => update("resume", e.target.files[0])}/>
      </div>
      <button className="btn-primary" onClick={handleSubmit}
        disabled={!form.district || !form.trade || loading}>
        {loading ? "Generating Ref-ID..." : "Register & Get Ref-ID"}
      </button>
    </div>
  );

  return (
    <div className="screen success">
      <div className="checkmark">✓</div>
      <h2>Registration Successful!</h2>
      <div className="ref-id-box">
        <p>Your Reference ID</p>
        <h3>{refId}</h3>
        <small>Save this ID for your records</small>
      </div>
      <p>Next step: Identity verification. Please ensure good lighting and a clear background.</p>
      <button className="btn-primary" onClick={() => onComplete({ ...form, refId })}>
        Proceed to Verification →
      </button>
    </div>
  );
}
