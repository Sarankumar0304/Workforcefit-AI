// src/pages/Results.jsx
// WorkforceFit AI — Fitment Result Screen

const CATEGORY_CONFIG = {
  JOB_READY: {
    label: "Job Ready",
    labelKn: "ಉದ್ಯೋಗಕ್ಕೆ ಸಿದ್ಧ",
    color: "#059669",
    bg: "#d1fae5",
    icon: "✅",
    message: "Congratulations! You are ready for direct job placement.",
    messageKn: "ಅಭಿನಂದನೆಗಳು! ನೀವು ನೇರ ಉದ್ಯೋಗ ನಿಯೋಜನೆಗೆ ಸಿದ್ಧರಾಗಿದ್ದೀರಿ.",
    next: "Our team will contact you within 3 working days with job opportunities."
  },
  SKILL_ENHANCEMENT_REQUIRED: {
    label: "Skill Enhancement Required",
    labelKn: "ಕೌಶಲ್ಯ ಅಭಿವೃದ್ಧಿ ಅಗತ್ಯ",
    color: "#2563EB",
    bg: "#dbeafe",
    icon: "📚",
    message: "You show great potential! A short training program will make you job-ready.",
    messageKn: "ನೀವು ಉತ್ತಮ ಸಾಮರ್ಥ್ಯ ತೋರಿಸುತ್ತೀರಿ! ಒಂದು ಸಣ್ಣ ತರಬೇತಿ ಕಾರ್ಯಕ್ರಮ ನಿಮ್ಮನ್ನು ಉದ್ಯೋಗಕ್ಕೆ ಸಿದ್ಧಗೊಳಿಸುತ್ತದೆ.",
    next: "You will be enrolled in a skill development program by NSDC/KSSDA."
  },
  MANUAL_VERIFICATION: {
    label: "Manual Verification",
    labelKn: "ಹಸ್ತಚಾಲಿತ ಪರಿಶೀಲನೆ",
    color: "#D97706",
    bg: "#fef3c7",
    icon: "🔍",
    message: "Our assessment team will review your profile in detail.",
    messageKn: "ನಮ್ಮ ಮೌಲ್ಯಮಾಪನ ತಂಡ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ವಿವರವಾಗಿ ಪರಿಶೀಲಿಸುತ್ತದೆ.",
    next: "A government officer will review your case within 5 working days."
  },
  INSUFFICIENT_CONFIDENCE: {
    label: "Low Confidence Score",
    labelKn: "ಕಡಿಮೆ ವಿಶ್ವಾಸ ಅಂಕ",
    color: "#7C3AED",
    bg: "#ede9fe",
    icon: "⚠️",
    message: "Technical issues affected your interview quality. You may retake the assessment.",
    messageKn: "ತಾಂತ್ರಿಕ ಸಮಸ್ಯೆಗಳು ನಿಮ್ಮ ಸಂದರ್ಶನದ ಗುಣಮಟ್ಟದ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಿವೆ.",
    next: "Please retake the interview in a quiet place with good lighting and internet."
  },
  POTENTIAL_IMPERSONATION: {
    label: "Verification Failed",
    labelKn: "ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ",
    color: "#DC2626",
    bg: "#fee2e2",
    icon: "🚫",
    message: "We could not verify your identity. Please visit your nearest Common Service Centre.",
    messageKn: "ನಾವು ನಿಮ್ಮ ಗುರುತನ್ನು ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    next: "Visit your nearest CSC or Seva Sindhu center with valid ID proof."
  }
};

export default function Results({ result }) {
  const { candidate, scores, fitment, refId } = result;
  const config = CATEGORY_CONFIG[fitment] || CATEGORY_CONFIG.MANUAL_VERIFICATION;
  const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
  const lang = candidate.language;

  return (
    <div className="results-screen">
      <div className="ref-header">Ref: {refId}</div>

      <div className="fitment-card" style={{ background: config.bg, borderColor: config.color }}>
        <div className="fit-icon">{config.icon}</div>
        <h2 style={{ color: config.color }}>
          {lang === "kn" ? config.labelKn : config.label}
        </h2>
        <p>{lang === "kn" ? config.messageKn : config.message}</p>
      </div>

      <div className="score-ring">
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
          <circle cx="50" cy="50" r="42" fill="none" stroke={config.color} strokeWidth="8"
            strokeDasharray={`${avgScore * 2.64} ${264 - avgScore * 2.64}`}
            strokeLinecap="round" transform="rotate(-90 50 50)"/>
          <text x="50" y="54" textAnchor="middle" fontSize="20" fontWeight="700" fill={config.color}>{avgScore}</text>
        </svg>
        <p>Overall Score</p>
      </div>

      <div className="breakdown">
        <h4>Score Breakdown</h4>
        {scores.map((s, i) => (
          <div key={i} className="score-row">
            <span>Q{i + 1}</span>
            <div className="mini-bar-wrap">
              <div className="mini-bar" style={{ width: `${Math.round(s * 100)}%`, background: config.color }}/>
            </div>
            <span>{Math.round(s * 100)}</span>
          </div>
        ))}
      </div>

      <div className="next-steps">
        <h4>Next Steps</h4>
        <p>{config.next}</p>
      </div>

      <div className="chatbot-prompt">
        <p>Have questions? Chat with our AI assistant.</p>
        <button className="btn-chat">Open Chatbot →</button>
      </div>
    </div>
  );
}
