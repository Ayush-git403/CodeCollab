import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:5000/api";

export default function UserSpace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load the user's recent rooms.
  useEffect(() => {
    let active = true;

    const fetchRooms = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (active) {
          setLoading(false);
          navigate("/login?next=app", { replace: true });
        }
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/room/user/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (active) {
          setRooms(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error(
          "Failed to fetch recent rooms:",
          err.response?.data || err.message
        );

        if (active && err.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchRooms();

    return () => {
      active = false;
    };
  }, [navigate]);

  // Open the room creation page.
  const handleCreateRoom = () => {
    navigate("/create");
  };

  // Join an existing room.
  const joinRoom = async () => {
    const id = roomId.trim().toUpperCase();

    if (!id) {
      setError("Please enter a room ID.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login?next=app");
        return;
      }

      await axios.get(`${API_URL}/room/${encodeURIComponent(id)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate(`/room/${encodeURIComponent(id)}`);
    } catch (err) {
      console.error(
        "Join room error:",
        err.response?.data || err.message
      );

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Room not found. Please check the room ID."
        );
      }
    } finally {
      setJoining(false);
    }
  };

  function timeAgo(iso) {
    if (!iso) return "recently";

    const timestamp = new Date(iso).getTime();

    if (Number.isNaN(timestamp)) return "recently";

    const diff = Math.max(
      0,
      Math.floor((Date.now() - timestamp) / 1000)
    );

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div style={S.page}>
      <Navbar />

      <div style={S.content}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Your Workspace</h1>
            <p style={S.sub}>
              Welcome back, {user?.username || "Developer"}
            </p>
          </div>

          {/* FIX: /create is registered in App.jsx; /admin is not. */}
          <button
            type="button"
            style={S.newBtn}
            onClick={handleCreateRoom}
          >
            New Room
          </button>
        </div>

        {/* Quick actions */}
        <div style={S.quickGrid}>
          <div
            style={S.quickCard}
            role="button"
            tabIndex={0}
            onClick={() => navigate("/create?type=room")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/create?type=room");
              }
            }}
          >
            <p style={S.quickTitle}>Collaborative Room</p>
            <p style={S.quickDesc}>
              Start a shared coding space with your team
            </p>
            <span style={S.quickArrow}>→</span>
          </div>

          <div style={S.quickCard}>
            <div style={S.joinRow}>
              <input
                style={S.joinInput}
                placeholder="Room ID"
                aria-label="Room ID"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value.toUpperCase());
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                maxLength={6}
              />

              <button
                type="button"
                style={{
                  ...S.joinBtn,
                  opacity: joining ? 0.6 : 1,
                  cursor: joining ? "wait" : "pointer",
                }}
                onClick={joinRoom}
                disabled={joining}
              >
                {joining ? "Joining..." : "Join"}
              </button>
            </div>

            {error && <p style={S.errorText}>{error}</p>}

            <p style={S.quickDesc}>
              Join an existing room with a room ID
            </p>
          </div>

          <div
            style={{
              ...S.quickCard,
              opacity: 0.5,
              cursor: "default",
            }}
          >
            <p style={S.quickTitle}>Contest Mode</p>
            <p style={S.quickDesc}>
              Race to match the target output
            </p>
            <span
              style={{
                ...S.quickArrow,
                color: "#484F58",
              }}
            >
              Coming soon
            </span>
          </div>
        </div>

        {/* Recent rooms */}
        <div style={S.section}>
          <p style={S.sectionTitle}>Recent Rooms</p>

          {loading && (
            <p style={S.emptyText}>Loading...</p>
          )}

          {!loading && rooms.length === 0 && (
            <p style={S.emptyText}>
              No rooms yet — create one to get started.
            </p>
          )}

          <div style={S.roomGrid}>
            {rooms.map((room) => {
              const id = room.id ?? room.roomId;

              if (!id) return null;

              return (
                <div
                  key={id}
                  style={S.roomCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/room/${id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/room/${id}`);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#58A6FF";
                    e.currentTarget.style.background = "#161B22";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#21262D";
                    e.currentTarget.style.background = "#0D1117";
                  }}
                >
                  <div style={S.roomCardTop}>
                    <p style={S.roomName}>
                      {room.name || "Untitled Room"}
                    </p>
                    <span style={S.roomId}>#{id}</span>
                  </div>

                  <p style={S.roomTime}>
                    Last visited {timeAgo(room.joined_at)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#0D1117",
    display: "flex",
    flexDirection: "column",
    fontFamily: "-apple-system,'Segoe UI',sans-serif",
    color: "#C9D1D9",
  },

  content: {
    flex: 1,
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "48px 24px",
    width: "100%",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "40px",
    flexWrap: "wrap",
  },

  title: {
    color: "#E6EDF3",
    fontSize: "28px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.5px",
  },

  sub: {
    color: "#484F58",
    fontSize: "14px",
    margin: "4px 0 0 0",
  },

  newBtn: {
    background: "#238636",
    color: "#fff",
    border: "1px solid #2ea043",
    borderRadius: "6px",
    padding: "9px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "48px",
  },

  quickCard: {
    background: "#161B22",
    border: "1px solid #21262D",
    borderRadius: "12px",
    padding: "20px 22px",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  quickTitle: {
    color: "#E6EDF3",
    fontSize: "15px",
    fontWeight: "700",
    margin: 0,
  },

  quickDesc: {
    color: "#484F58",
    fontSize: "13px",
    margin: 0,
  },

  quickArrow: {
    color: "#58A6FF",
    fontSize: "13px",
    fontWeight: "600",
  },

  joinRow: {
    display: "flex",
    gap: "8px",
  },

  joinInput: {
    flex: 1,
    minWidth: 0,
    background: "#0D1117",
    border: "1px solid #30363D",
    borderRadius: "6px",
    color: "#E6EDF3",
    padding: "8px 12px",
    fontSize: "13px",
    outline: "none",
    fontFamily: "monospace",
    letterSpacing: "2px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  joinBtn: {
    background: "#21262D",
    color: "#C9D1D9",
    border: "1px solid #30363D",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  errorText: {
    color: "#F78166",
    fontSize: "12px",
    margin: 0,
  },

  section: {
    marginTop: "8px",
  },

  sectionTitle: {
    color: "#8B949E",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    margin: "0 0 16px 0",
  },

  emptyText: {
    color: "#484F58",
    fontSize: "14px",
  },

  roomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "12px",
  },

  roomCard: {
    background: "#0D1117",
    border: "1px solid #21262D",
    borderRadius: "10px",
    padding: "16px 18px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  roomCardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  roomName: {
    color: "#E6EDF3",
    fontSize: "14px",
    fontWeight: "700",
    margin: 0,
  },

  roomId: {
    color: "#484F58",
    fontSize: "11px",
    fontFamily: "monospace",
    background: "#161B22",
    padding: "2px 6px",
    borderRadius: "4px",
    flexShrink: 0,
  },

  roomTime: {
    color: "#484F58",
    fontSize: "12px",
    margin: 0,
  },
};