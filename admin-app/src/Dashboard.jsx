import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import "./App.css";

const API_BASE = "http://localhost:8000"; // replace with Render URL after deployment

const FITMENT_COLORS = {
  JOB_READY: "#10B981",
  SKILL_ENHANCEMENT_REQUIRED: "#3B82F6",
  MANUAL_VERIFICATION: "#F59E0B",
  INSUFFICIENT_CONFIDENCE: "#8B5CF6",
  POTENTIAL_IMPERSONATION: "#EF4444",
};

const LABELS = {
  JOB_READY: "Job Ready",
  SKILL_ENHANCEMENT_REQUIRED: "Requires Upskilling",
  MANUAL_VERIFICATION: "Manual Verification",
  INSUFFICIENT_CONFIDENCE: "Low Confidence",
  POTENTIAL_IMPERSONATION: "Suspected Duplicate/Fraud",
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [candidates, setCandidates] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [fitmentFilter, setFitmentFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ language: "kn", trade: "General", text: "", expectedKeywords: "" });
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [candsRes, statsRes, qRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/candidates`),
      fetch(`${API_BASE}/api/admin/stats`),
      fetch(`${API_BASE}/api/admin/questions`),
    ]);
    const cands = await candsRes.json();
    setCandidates(cands);
    setStats(await statsRes.json());
    setQuestions(await qRes.json());
    setSelected((old) => old ? cands.find((c) => c.refId === old.refId) || old : cands[0] || null);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const districts = useMemo(() => ["All", ...new Set(candidates.map((c) => c.district).filter(Boolean))], [candidates]);
  const filtered = candidates.filter((c) => {
    const s = search.toLowerCase();
    return (districtFilter === "All" || c.district === districtFilter)
      && (fitmentFilter === "All" || c.fitment === fitmentFilter)
      && (!s || `${c.name} ${c.refId} ${c.phone} ${c.trade}`.toLowerCase().includes(s));
  });

  async function mark(refId, action) {
    await fetch(`${API_BASE}/api/admin/candidates/${refId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadData();
  }

  async function createQuestion(e) {
    e.preventDefault();
    const payload = {
      language: form.language,
      trade: form.trade || "General",
      text: form.text,
      expectedKeywords: form.expectedKeywords.split(",").map((x) => x.trim()).filter(Boolean),
      maxScore: 20,
    };
    await fetch(`${API_BASE}/api/admin/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setForm({ ...form, text: "", expectedKeywords: "" });
    await loadData();
  }

  if (loading) return <div className="loading">Loading WorkforceFit AI admin console...</div>;

  return (
    <div className="admin-shell">
      <aside className="side">
        <div className="brand"><span>WF</span><div><b>WorkforceFit AI</b><small>EDCS Karnataka</small></div></div>
        <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>Dashboard</button>
        <button className={tab === "questions" ? "active" : ""} onClick={() => setTab("questions")}>Question Builder</button>
        <button onClick={loadData}>Refresh Sync</button>
      </aside>

      <main className="main">
        <header className="top">
          <div><h1>AI SkillFit Admin Console</h1><p>District-wise fitment, interview scores, verification flags and admin-created questions.</p></div>
          <div className="sync">Last sync: {new Date().toLocaleTimeString()}</div>
        </header>

        {tab === "dashboard" && (
          <>
            <section className="stats-grid">
              <div className="stat-card"><span>Total</span><b>{stats.total}</b></div>
              <div className="stat-card"><span>Classified</span><b>{stats.classified}</b></div>
              <div className="stat-card"><span>Flagged</span><b>{stats.flagged}</b></div>
              <div className="stat-card"><span>Questions</span><b>{questions.length}</b></div>
            </section>

            <section className="charts-row">
              <div className="chart-card"><h3>District Intake</h3><ResponsiveContainer width="100%" height={190}><BarChart data={stats.byDistrict || []}><XAxis dataKey="district" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
              <div className="chart-card"><h3>Fitment Distribution</h3><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={stats.distribution || []} dataKey="value" nameKey="name" outerRadius={72} label>{(stats.distribution || []).map((entry, i) => <Cell key={i} fill={FITMENT_COLORS[entry.name] || Object.values(FITMENT_COLORS)[i % 5]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            </section>

            <section className="workbench">
              <div className="table-panel">
                <div className="filters">
                  <input placeholder="Search name, phone, Ref-ID or trade..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}>{districts.map((d) => <option key={d}>{d}</option>)}</select>
                  <select value={fitmentFilter} onChange={(e) => setFitmentFilter(e.target.value)}><option>All</option>{Object.keys(LABELS).map((k) => <option key={k} value={k}>{LABELS[k]}</option>)}</select>
                </div>
                <table>
                  <thead><tr><th>Ref-ID</th><th>Name</th><th>District</th><th>Trade</th><th>Score</th><th>Fitment</th></tr></thead>
                  <tbody>{filtered.map((c) => <tr key={c.refId} onClick={() => setSelected(c)} className={selected?.refId === c.refId ? "selected" : ""}><td>{c.refId}</td><td>{c.name}</td><td>{c.district}</td><td>{c.trade}</td><td><b>{c.score ?? "--"}</b></td><td><span className="badge" style={{ background: `${FITMENT_COLORS[c.fitment] || "#64748B"}22`, color: FITMENT_COLORS[c.fitment] || "#CBD5E1" }}>{LABELS[c.fitment] || "Registered"}</span></td></tr>)}</tbody>
                </table>
              </div>

              <div className="detail-panel">
                {selected ? <>
                  <h2>{selected.name}</h2><p className="muted">{selected.refId} · {selected.trade} · {selected.language}</p>
                  <div className="score-card"><span>Overall Score</span><b>{selected.score ?? "--"}/100</b><em>{LABELS[selected.fitment] || selected.status}</em></div>
                  <div className="verify-grid"><div>Face: <b>{Math.round((selected.livenessScore || 0) * 100)}%</b></div><div>Voice: <b>{Math.round((selected.voiceScore || 0) * 100)}%</b></div><div>Duplicate: <b>{selected.duplicateFlag ? "Yes" : "No"}</b></div></div>
                  <h3>Interview Summary</h3>
                  <div className="answers">{(selected.answers || []).length ? selected.answers.map((a, i) => <div className="answer" key={i}><b>Q{i + 1}. {a.question}</b><p>{a.answer}</p><small>Relevance {Math.round(a.relevance * 100)} · Clarity {Math.round(a.clarity * 100)} · Confidence {Math.round(a.confidence * 100)}</small></div>) : <p className="muted">No interview answers yet.</p>}</div>
                  <div className="actions"><button onClick={() => mark(selected.refId, "SHORTLISTED")}>Shortlist Job</button><button onClick={() => mark(selected.refId, "TRAINING")}>Send Training</button><button onClick={() => mark(selected.refId, "REVIEW")}>Manual Review</button></div>
                </> : <p>Select a candidate</p>}
              </div>
            </section>
          </>
        )}

        {tab === "questions" && (
          <section className="question-layout">
            <form className="question-form" onSubmit={createQuestion}>
              <h2>Create Interview Question</h2>
              <label>Language</label><select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}><option value="kn">Kannada</option><option value="hi">Hindi</option><option value="en">English</option></select>
              <label>Trade / Role</label><input value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="General, Electrician, Welder..." />
              <label>Question</label><textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required placeholder="Enter question shown in mobile interview" />
              <label>Expected Keywords, comma separated</label><input value={form.expectedKeywords} onChange={(e) => setForm({ ...form, expectedKeywords: e.target.value })} placeholder="safety, tools, experience" />
              <button type="submit">Add Question to Mobile Interview</button>
            </form>
            <div className="question-list"><h2>Active Question Bank</h2>{questions.map((q) => <div className="q-card" key={q.id}><b>{q.language.toUpperCase()} · {q.trade}</b><p>{q.text}</p><small>Keywords: {(q.expectedKeywords || []).join(", ") || "--"}</small></div>)}</div>
          </section>
        )}
      </main>
    </div>
  );
}
