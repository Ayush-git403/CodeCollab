import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function CreateRoom() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const { user }        = useAuth();

  const type = searchParams.get("type");
  const mode = type === "room" ? "room" : type === "contest" ? "contest" : null;

  const [name, setName]               = useState("");
  const [targetOutput, setTargetOutput] = useState("");
  const [timeLimit, setTimeLimit]     = useState(300);
  const [createdId, setCreatedId]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const token = localStorage.getItem("token");

  const goBack = () => {
    setName(""); setTargetOutput(""); setTimeLimit(300);
    setCreatedId(null); setError("");
    navigate("/dashboard");
  };

  const createRoom = async () => {
    if (!name.trim()) { setError("Enter a room name"); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/room/create",
        { name, language: "javascript", targetOutput: "", timeLimit: 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreatedId(res.data.roomId);
    } catch (err) {
      console.error("Create room error:", err.response?.data);
      setError(err.response?.data?.error || "Failed to create room");
    }
    setLoading(false);
  };

  const createContest = async () => {
    if (!name.trim())         { setError("Enter a contest name"); return; }
    if (!targetOutput.trim()) { setError("Enter the target output"); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/room/create",
        { name, language: "javascript", targetOutput, timeLimit: Number(timeLimit) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreatedId(res.data.roomId);
    } catch (err) {
      console.error("Create contest error:", err.response?.data);
      setError(err.response?.data?.error || "Failed to create contest");
    }
    setLoading(false);
  };

  const enterRoom = () => {
    // Use the actual logged-in user — not hardcoded "Admin"
    localStorage.setItem("username", user?.username || "User");
    localStorage.setItem("userId",   user?.id       || Math.random().toString(36).substring(2));
    navigate(`/room/${createdId}`);
  };

  // ── Mode selection ──────────────────────────────────────────────────────────
  if (!mode) return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.title}>What do you want to create?</h2>
        <p style={S.sub}>Choose the type of room to set up</p>

        <div style={S.optionCard} onClick={() => navigate("/create?type=room")}>
          <div>
            <p style={S.optionTitle}>Collaborative Room</p>
            <p style={S.optionDesc}>
              Team joins one shared editor. Everyone codes together in real time.
              Great for hackathons and pair programming.
            </p>
          </div>
        </div>

        <div
          style={{ ...S.optionCard, borderColor: "#F78166" }}
          onClick={() => navigate("/create?type=contest")}
        >
          <div>
            <p style={S.optionTitle}>Contest Room</p>
            <p style={S.optionDesc}>
              Set a target output. Everyone races to match it.
              Live leaderboard updates in real time.
            </p>
          </div>
        </div>

        <button style={S.backBtn} onClick={goBack}>← Back</button>
      </div>
    </div>
  );

  // ── Collaborative Room ──────────────────────────────────────────────────────
  if (mode === "room") return (
    <div style={S.page}>
      <div style={S.card}>
        <button style={S.backBtn} onClick={goBack}>← Back</button>
        <h2 style={S.title}>Create Collaborative Room</h2>
        <p style={S.sub}>Give your room a name — your team will join using the room ID</p>

        <input
          style={S.input}
          placeholder="Room name (e.g. Hackathon Team 4)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createRoom()}
          autoFocus
        />

        {error && <p style={S.errorText}>{error}</p>}

        <button
          style={{ ...S.primaryBtn, opacity: loading ? 0.7 : 1 }}
          onClick={createRoom}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Room"}
        </button>

        {createdId && (
          <div style={S.result}>
            <p style={S.successText}>Room created successfully!</p>
            <p style={S.idLabel}>Share this Room ID with your team:</p>
            <div style={S.idBox}>
              <span style={S.idText}>{createdId}</span>
              <button
                style={S.copyBtn}
                onClick={() => navigator.clipboard.writeText(createdId)}
              >
                Copy
              </button>
            </div>
            <button style={S.enterBtn} onClick={enterRoom}>
              Enter Room →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── Contest Room ────────────────────────────────────────────────────────────
  if (mode === "contest") return (
    <div style={S.page}>
      <div style={S.card}>
        <button style={S.backBtn} onClick={goBack}>← Back</button>
        <h2 style={S.title}>Create Contest Room</h2>
        <p style={S.sub}>Set a challenge — participants race to match the output</p>

        <input
          style={S.input}
          placeholder="Contest name (e.g. Friday Challenge)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <textarea
          style={{ ...S.input, height: "100px", resize: "vertical" }}
          placeholder="Target output — exactly what users must produce"
          value={targetOutput}
          onChange={(e) => setTargetOutput(e.target.value)}
        />
        <input
          style={S.input}
          type="number"
          placeholder="Time limit in seconds (e.g. 300 = 5 mins)"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
        />

        {error && <p style={S.errorText}>{error}</p>}

        <button
          style={{ ...S.primaryBtn, background: "#F78166", opacity: loading ? 0.7 : 1 }}
          onClick={createContest}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Contest"}
        </button>

        {createdId && (
          <div style={S.result}>
            <p style={S.successText}>Contest created successfully!</p>
            <p style={S.idLabel}>Share this Contest ID with participants:</p>
            <div style={S.idBox}>
              <span style={S.idText}>{createdId}</span>
              <button
                style={S.copyBtn}
                onClick={() => navigator.clipboard.writeText(createdId)}
              >
                Copy
              </button>
            </div>
            <button
              style={{ ...S.enterBtn, background: "#F78166" }}
              onClick={enterRoom}
            >
              Enter Contest →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh", background: "#0D1117",
    display: "flex", alignItems: "center",
    justifyContent: "center", padding: "20px",
  },
  card: {
    background: "#161B22", border: "1px solid #30363D",
    borderRadius: "12px", padding: "32px",
    width: "440px", display: "flex",
    flexDirection: "column", gap: "14px",
  },
  title: {
    color: "#58A6FF", margin: 0,
    fontSize: "18px", textAlign: "center",
  },
  sub: {
    color: "#8B949E", margin: 0,
    fontSize: "13px", textAlign: "center", lineHeight: "1.5",
  },
  optionCard: {
    display: "flex", alignItems: "flex-start", gap: "14px",
    background: "#0D1117", border: "1px solid #30363D",
    borderRadius: "8px", padding: "16px", cursor: "pointer",
  },
  optionTitle: {
    color: "#C9D1D9", fontWeight: "bold",
    fontSize: "14px", margin: "0 0 4px 0",
  },
  optionDesc: {
    color: "#8B949E", fontSize: "12px",
    margin: 0, lineHeight: "1.5",
  },
  input: {
    background: "#0D1117", border: "1px solid #30363D",
    borderRadius: "6px", color: "#C9D1D9",
    padding: "10px 14px", fontSize: "14px",
    outline: "none", width: "100%",
    boxSizing: "border-box", fontFamily: "inherit",
  },
  errorText: {
    color: "#F78166", fontSize: "13px", margin: 0,
  },
  primaryBtn: {
    background: "#58A6FF", color: "#fff",
    border: "none", borderRadius: "6px",
    padding: "12px", fontSize: "15px",
    cursor: "pointer", fontWeight: "bold",
    fontFamily: "inherit",
  },
  backBtn: {
    background: "transparent", color: "#8B949E",
    border: "none", cursor: "pointer",
    fontSize: "13px", textAlign: "left", padding: 0,
  },
  result: {
    background: "#0D1117", border: "1px solid #30363D",
    borderRadius: "8px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  successText: {
    color: "#3FB950", fontWeight: "bold",
    margin: 0, fontSize: "14px",
  },
  idLabel: { color: "#8B949E", fontSize: "12px", margin: 0 },
  idBox: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    background: "#161B22", border: "1px solid #30363D",
    borderRadius: "6px", padding: "10px 14px",
  },
  idText: {
    color: "#3FB950", fontFamily: "monospace",
    fontWeight: "bold", fontSize: "20px", letterSpacing: "3px",
  },
  copyBtn: {
    background: "#21262D", color: "#C9D1D9",
    border: "1px solid #30363D", borderRadius: "4px",
    padding: "4px 10px", cursor: "pointer", fontSize: "12px",
  },
  enterBtn: {
    background: "#238636", color: "#fff",
    border: "none", borderRadius: "6px",
    padding: "10px", fontSize: "14px",
    cursor: "pointer", fontWeight: "bold",
  },
};