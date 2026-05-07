// admin/Dashboard.jsx
// WorkforceFit AI — Government Admin Console

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const FITMENT_COLORS = {
  JOB_READY: "#059669",
  SKILL_ENHANCEMENT_REQUIRED: "#2563EB",
  MANUAL_VERIFICATION: "#D97706",
  INSUFFICIENT_CONFIDENCE: "#7C3AED",
  POTENTIAL_IMPERSONATION: "#DC2626"
};

const DISTRICTS = ["All","Bengaluru","Mysuru","Belagavi","Haveri","Kalaburagi","Dharwad"];
const CATEGORIES = ["All","Job Ready","Skill Enh.","Manual","Low Conf.","Flagged"];

export default function AdminDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [districtFilter, setDistrictFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [candsRes, statsRes] = await Promise.all([
        fetch("/api/admin/candidates"),
        fetch("/api/admin/stats")
      ]);
      setCandidates(await candsRes.json());
      setStats(await statsRes.json());
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = candidates.filter(c => {
    const matchDist = districtFilter === "All" || c.district === districtFilter;
    const matchCat = categoryFilter === "All" || c.fitment.includes(categoryFilter.toUpperCase());
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
      || c.refId.includes(search);
    return matchDist && matchCat && matchSearch;
  });

  async function shortlist(refId, action) {
    await fetch(`/api/admin/candidates/${refId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setCandidates(cs => cs.map(c => c.refId === refId ? { ...c, status: action } : c));
  }

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>WorkforceFit AI — Admin Console</h1>
          <p>Karnataka Directorate of EDCS · District Workforce Portal</p>
        </div>
        <div className="admin-meta">
          <span>Last sync: {new Date().toLocaleTimeString()}</span>
          <button className="btn-export" onClick={() => alert("Exporting CSV...")}>Export CSV</button>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="stats-grid">
        {Object.entries(stats?.byCategory || {}).map(([cat, count]) => (
          <div key={cat} className="stat-card" style={{ borderTop: `3px solid ${FITMENT_COLORS[cat]}` }}>
            <div className="stat-num" style={{ color: FITMENT_COLORS[cat] }}>{count}</div>
            <div className="stat-lbl">{cat.replace(/_/g, " ")}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>By District</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats?.byDistrict || []}>
              <XAxis dataKey="district" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }}/>
              <Tooltip/>
              <Bar dataKey="count" fill="#1B4FD8" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Fitment Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={stats?.distribution || []} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={70} label>
                {(stats?.distribution || []).map((entry, i) => (
                  <Cell key={i} fill={Object.values(FITMENT_COLORS)[i]}/>
                ))}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input className="search-input" placeholder="Search by name or Ref-ID..." 
          value={search} onChange={e => setSearch(e.target.value)}/>
        <div className="filter-group">
          <label>District</label>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Category</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ref-ID</th><th>Name</th><th>District</th><th>Trade</th>
              <th>Language</th><th>Score</th><th>Category</th><th>Flags</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.refId} className={c.fitment === "POTENTIAL_IMPERSONATION" ? "row-danger" : ""}>
                <td className="ref-cell">{c.refId}</td>
                <td>{c.name}</td>
                <td>{c.district}</td>
                <td>{c.trade}</td>
                <td>{c.language === "kn" ? "ಕನ್ನಡ" : c.language === "hi" ? "हिंदी" : "EN"}</td>
                <td><strong>{c.score}</strong></td>
                <td>
                  <span className="cat-badge" style={{
                    background: FITMENT_COLORS[c.fitment] + "22",
                    color: FITMENT_COLORS[c.fitment]
                  }}>
                    {c.fitment.replace(/_/g, " ")}
                  </span>
                </td>
                <td>
                  {c.duplicateFlag && <span className="flag">DUP</span>}
                  {c.livenessScore < 0.5 && <span className="flag">LVN</span>}
                  {c.fraudScore > 0.7 && <span className="flag red">FRAUD</span>}
                </td>
                <td>
                  <div className="action-btns">
                    {c.fitment === "JOB_READY" &&
                      <button onClick={() => shortlist(c.refId, "SHORTLISTED")} className="btn-sm green">Shortlist</button>}
                    {c.fitment === "SKILL_ENHANCEMENT_REQUIRED" &&
                      <button onClick={() => shortlist(c.refId, "TRAINING")} className="btn-sm blue">Training</button>}
                    {(c.fitment === "MANUAL_VERIFICATION" || c.fitment === "POTENTIAL_IMPERSONATION") &&
                      <button onClick={() => shortlist(c.refId, "REVIEW")} className="btn-sm amber">Review</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">{filtered.length} candidates shown · {candidates.length} total</div>
      </div>
    </div>
  );
}
