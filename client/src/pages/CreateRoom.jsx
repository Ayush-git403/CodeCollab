import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function Admin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const type = searchParams.get("type");

  // Get mode directly from URL
  const mode =
    type === "room"
      ? "room"
      : type === "contest"
      ? "contest"
      : null;

  const [name, setName] = useState("");
  const [targetOutput, setTargetOutput] = useState("");
  const [timeLimit, setTimeLimit] = useState(300);
  const [createdId, setCreatedId] = useState(null);

  // -----------------------------------------
  // BACK TO DASHBOARD + REOPEN CREATE DIALOG
  // -----------------------------------------
  const backToDashboard = () => {
    setName("");
    setTargetOutput("");
    setTimeLimit(300);
    setCreatedId(null);

    navigate("/dashboard?createRoom=true");
  };

  // -----------------------------------------
  // CREATE COLLABORATIVE ROOM
  // -----------------------------------------
  const createRoom = async () => {
    if (!name.trim()) {
      alert("Enter a room name");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/room/create",
        {
          name,
          language: "python",
          targetOutput: "",
          timeLimit: 0,
        }
      );

      setCreatedId(res.data.roomId);
    } catch (error) {
      console.error(error);
      alert("Failed to create room");
    }
  };

  // -----------------------------------------
  // CREATE CONTEST
  // -----------------------------------------
  const createContest = async () => {
    if (!name.trim()) {
      alert("Enter a contest name");
      return;
    }

    if (!targetOutput.trim()) {
      alert("Enter the target output");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/room/create",
        {
          name,
          language: "python",
          targetOutput,
          timeLimit: Number(timeLimit),
        }
      );

      setCreatedId(res.data.roomId);
    } catch (error) {
      console.error(error);
      alert("Failed to create contest");
    }
  };

  // =========================================
  // NO TYPE → OLD SELECTION SCREEN
  // =========================================
  if (!mode) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>

          <h2 style={styles.title}>
            What do you want to create?
          </h2>

          <p style={styles.sub}>
            Choose the type of room to set up
          </p>

          {/* Collaborative Room */}
          <div
            style={styles.optionCard}
            onClick={() => navigate("/admin?type=room")}
          >
            <span style={styles.optionIcon}>🏠</span>

            <div>
              <p style={styles.optionTitle}>
                Collaborative Room
              </p>

              <p style={styles.optionDesc}>
                Team joins one shared editor. Everyone codes
                together in real time. Great for hackathons
                and pair programming.
              </p>
            </div>
          </div>

          {/* Contest Room */}
          <div
            style={{
              ...styles.optionCard,
              borderColor: "#F78166",
            }}
            onClick={() => navigate("/admin?type=contest")}
          >
            <span style={styles.optionIcon}>⚡</span>

            <div>
              <p style={styles.optionTitle}>
                Contest Room
              </p>

              <p style={styles.optionDesc}>
                Set a target output. Everyone races to match
                it. Live leaderboard updates in real time.
              </p>
            </div>
          </div>

          {/* BACK TO DASHBOARD + OPEN DIALOG */}
          <button
            style={styles.backBtn}
            onClick={backToDashboard}
          >
            ← Back
          </button>

        </div>
      </div>
    );
  }

  // =========================================
  // COLLABORATIVE ROOM
  // =========================================
  if (mode === "room") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>

          {/* BACK */}
          <button
            style={styles.backBtn}
            onClick={backToDashboard}
          >
            ← Back
          </button>

          <h2 style={styles.title}>
            🏠 Create Collaborative Room
          </h2>

          <p style={styles.sub}>
            Give your room a name — your team will join
            using the room ID
          </p>

          <input
            style={styles.input}
            placeholder="Room name (e.g. Hackathon Team 4)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                createRoom();
              }
            }}
            autoFocus
          />

          <button
            style={styles.primaryBtn}
            onClick={createRoom}
          >
            Create Room
          </button>

          {/* CREATED ROOM */}
          {createdId && (
            <div style={styles.result}>

              <p style={styles.successText}>
                ✅ Room created!
              </p>

              <p style={styles.idLabel}>
                Share this Room ID with your team:
              </p>

              <div style={styles.idBox}>

                <span style={styles.idText}>
                  {createdId}
                </span>

                <button
                  style={styles.copyBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(
                      createdId
                    );
                  }}
                >
                  Copy
                </button>

              </div>

              <button
                style={styles.enterBtn}
                onClick={() => {
                  localStorage.setItem(
                    "username",
                    "Admin"
                  );

                  localStorage.setItem(
                    "userId",
                    Math.random()
                      .toString(36)
                      .substring(2)
                  );

                  navigate(`/room/${createdId}`);
                }}
              >
                Enter Room →
              </button>

            </div>
          )}

        </div>
      </div>
    );
  }

  // =========================================
  // CONTEST ROOM
  // =========================================
  if (mode === "contest") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>

          {/* BACK */}
          <button
            style={styles.backBtn}
            onClick={backToDashboard}
          >
            ← Back
          </button>

          <h2 style={styles.title}>
            ⚡ Create Contest Room
          </h2>

          <p style={styles.sub}>
            Set a challenge — participants race to match
            the output
          </p>

          {/* CONTEST NAME */}
          <input
            style={styles.input}
            placeholder="Contest name (e.g. Friday Challenge)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          {/* TARGET OUTPUT */}
          <textarea
            style={{
              ...styles.input,
              height: "100px",
              resize: "vertical",
            }}
            placeholder="Target output — exactly what users must produce"
            value={targetOutput}
            onChange={(e) =>
              setTargetOutput(e.target.value)
            }
          />

          {/* TIME LIMIT */}
          <input
            style={styles.input}
            type="number"
            placeholder="Time limit in seconds (e.g. 300 = 5 mins)"
            value={timeLimit}
            onChange={(e) =>
              setTimeLimit(e.target.value)
            }
          />

          <button
            style={{
              ...styles.primaryBtn,
              background: "#F78166",
            }}
            onClick={createContest}
          >
            Create Contest
          </button>

          {/* CREATED CONTEST */}
          {createdId && (
            <div style={styles.result}>

              <p style={styles.successText}>
                ✅ Contest created!
              </p>

              <p style={styles.idLabel}>
                Share this Contest ID with participants:
              </p>

              <div style={styles.idBox}>

                <span style={styles.idText}>
                  {createdId}
                </span>

                <button
                  style={styles.copyBtn}
                  onClick={() =>
                    navigator.clipboard.writeText(
                      createdId
                    )
                  }
                >
                  Copy
                </button>

              </div>

              <button
                style={{
                  ...styles.enterBtn,
                  background: "#F78166",
                }}
                onClick={() => {
                  localStorage.setItem(
                    "username",
                    "Admin"
                  );

                  localStorage.setItem(
                    "userId",
                    Math.random()
                      .toString(36)
                      .substring(2)
                  );

                  navigate(`/room/${createdId}`);
                }}
              >
                Enter Contest →
              </button>

            </div>
          )}

        </div>
      </div>
    );
  }
}

// =========================================
// STYLES
// =========================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0D1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  card: {
    background: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "12px",
    padding: "32px",
    width: "440px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  title: {
    color: "#58A6FF",
    margin: 0,
    fontSize: "18px",
    textAlign: "center",
  },

  sub: {
    color: "#8B949E",
    margin: 0,
    fontSize: "13px",
    textAlign: "center",
    lineHeight: "1.5",
  },

  optionCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    background: "#0D1117",
    border: "1px solid #30363D",
    borderRadius: "8px",
    padding: "16px",
    cursor: "pointer",
  },

  optionIcon: {
    fontSize: "28px",
    flexShrink: 0,
  },

  optionTitle: {
    color: "#C9D1D9",
    fontWeight: "bold",
    fontSize: "14px",
    margin: "0 0 4px 0",
  },

  optionDesc: {
    color: "#8B949E",
    fontSize: "12px",
    margin: 0,
    lineHeight: "1.5",
  },

  input: {
    background: "#0D1117",
    border: "1px solid #30363D",
    borderRadius: "6px",
    color: "#C9D1D9",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  primaryBtn: {
    background: "#58A6FF",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "15px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  backBtn: {
    background: "transparent",
    color: "#8B949E",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    textAlign: "left",
    padding: 0,
  },

  result: {
    background: "#0D1117",
    border: "1px solid #30363D",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  successText: {
    color: "#3FB950",
    fontWeight: "bold",
    margin: 0,
    fontSize: "14px",
  },

  idLabel: {
    color: "#8B949E",
    fontSize: "12px",
    margin: 0,
  },

  idBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "6px",
    padding: "10px 14px",
  },

  idText: {
    color: "#3FB950",
    fontFamily: "monospace",
    fontWeight: "bold",
    fontSize: "20px",
    letterSpacing: "3px",
  },

  copyBtn: {
    background: "#21262D",
    color: "#C9D1D9",
    border: "1px solid #30363D",
    borderRadius: "4px",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "12px",
  },

  enterBtn: {
    background: "#238636",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "10px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};