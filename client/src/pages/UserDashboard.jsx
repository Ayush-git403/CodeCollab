import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function UserSpace() {
  const { user }            = useAuth();
  const navigate            = useNavigate();
  const [rooms, setRooms]   = useState([]);
  const [roomId, setRoomId] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/api/room/user/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setRooms(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const joinRoom = async () => {
    if (!roomId.trim()) return;
    setJoining(true); setError("");
    try {
      await axios.get(`http://localhost:5000/api/room/${roomId.toUpperCase()}`);
      navigate(`/room/${roomId.toUpperCase()}`);
    } catch {
      setError("Room not found");
    }
    setJoining(false);
  };

  function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)    return "just now";
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  }

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.content}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Your Workspace</h1>
            <p style={S.sub}>Welcome back, {user?.username}</p>
          </div>
          <button style={S.newBtn} onClick={() => navigate("/admin")}>
            New Room
          </button>
        </div>

        {/* Quick actions */}
        <div style={S.quickGrid}>
          <div style={S.quickCard} onClick={() => navigate("/admin?type=room")}>
            <p style={S.quickTitle}>Collaborative Room</p>
            <p style={S.quickDesc}>Start a shared coding space with your team</p>
            <span style={S.quickArrow}>→</span>
          </div>
          <div style={S.quickCard}>
            <div style={S.joinRow}>
              <input
                style={S.joinInput}
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                maxLength={6}
              />
              <button style={S.joinBtn} onClick={joinRoom} disabled={joining}>
                {joining ? "..." : "Join"}
              </button>
            </div>
            {error && <p style={S.errorText}>{error}</p>}
            <p style={S.quickDesc}>Join an existing room with a room ID</p>
          </div>
          <div style={{ ...S.quickCard, opacity: 0.5, cursor: "default" }}>
            <p style={S.quickTitle}>Contest Mode</p>
            <p style={S.quickDesc}>Race to match the target output</p>
            <span style={{ ...S.quickArrow, color: "#484F58" }}>Coming soon</span>
          </div>
        </div>

        {/* Recent rooms */}
        <div style={S.section}>
          <p style={S.sectionTitle}>Recent Rooms</p>
          {loading && <p style={S.emptyText}>Loading...</p>}
          {!loading && rooms.length === 0 && (
            <p style={S.emptyText}>No rooms yet — create one to get started.</p>
          )}
          <div style={S.roomGrid}>
            {rooms.map((room) => (
              <div
                key={room.id}
                style={S.roomCard}
                onClick={() => navigate(`/room/${room.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#58A6FF";
                  e.currentTarget.style.background  = "#161B22";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#21262D";
                  e.currentTarget.style.background  = "#0D1117";
                }}
              >
                <div style={S.roomCardTop}>
                  <p style={S.roomName}>{room.name}</p>
                  <span style={S.roomId}>#{room.id}</span>
                </div>
                <p style={S.roomTime}>Last visited {timeAgo(room.joined_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh", background: "#0D1117",
    display: "flex", flexDirection: "column",
    fontFamily: "-apple-system,'Segoe UI',sans-serif",
    color: "#C9D1D9",
  },
  content: {
    flex: 1, maxWidth: "1100px",
    margin: "0 auto", padding: "48px 24px",
    width: "100%", boxSizing: "border-box",
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "40px",
  },
  title: {
    color: "#E6EDF3", fontSize: "28px",
    fontWeight: "800", margin: 0,
    letterSpacing: "-0.5px",
  },
  sub: { color: "#484F58", fontSize: "14px", margin: "4px 0 0 0" },
  newBtn: {
    background: "#238636", color: "#fff",
    border: "1px solid #2ea043", borderRadius: "6px",
    padding: "9px 20px", fontSize: "14px",
    fontWeight: "600", cursor: "pointer",
    fontFamily: "inherit",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px", marginBottom: "48px",
  },
  quickCard: {
    background: "#161B22", border: "1px solid #21262D",
    borderRadius: "12px", padding: "20px 22px",
    cursor: "pointer", position: "relative",
    transition: "all 0.2s",
    display: "flex", flexDirection: "column", gap: "8px",
  },
  quickTitle: {
    color: "#E6EDF3", fontSize: "15px",
    fontWeight: "700", margin: 0,
  },
  quickDesc: { color: "#484F58", fontSize: "13px", margin: 0 },
  quickArrow: { color: "#58A6FF", fontSize: "13px", fontWeight: "600" },
  joinRow:  { display: "flex", gap: "8px" },
  joinInput: {
    flex: 1, background: "#0D1117",
    border: "1px solid #30363D", borderRadius: "6px",
    color: "#E6EDF3", padding: "8px 12px",
    fontSize: "13px", outline: "none",
    fontFamily: "monospace", letterSpacing: "2px",
    fontWeight: "700", textTransform: "uppercase",
  },
  joinBtn: {
    background: "#21262D", color: "#C9D1D9",
    border: "1px solid #30363D", borderRadius: "6px",
    padding: "8px 16px", fontSize: "13px",
    fontWeight: "600", cursor: "pointer",
    fontFamily: "inherit",
  },
  errorText: { color: "#F78166", fontSize: "12px", margin: 0 },
  section: { marginTop: "8px" },
  sectionTitle: {
    color: "#8B949E", fontSize: "11px",
    fontWeight: "700", letterSpacing: "0.8px",
    textTransform: "uppercase", margin: "0 0 16px 0",
  },
  emptyText: { color: "#484F58", fontSize: "14px" },
  roomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "12px",
  },
  roomCard: {
    background: "#0D1117", border: "1px solid #21262D",
    borderRadius: "10px", padding: "16px 18px",
    cursor: "pointer", transition: "all 0.2s",
    display: "flex", flexDirection: "column", gap: "8px",
  },
  roomCardTop: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
  },
  roomName: { color: "#E6EDF3", fontSize: "14px", fontWeight: "700", margin: 0 },
  roomId:   {
    color: "#484F58", fontSize: "11px",
    fontFamily: "monospace", background: "#161B22",
    padding: "2px 6px", borderRadius: "4px",
  },
  roomTime: { color: "#484F58", fontSize: "12px", margin: 0 },
};