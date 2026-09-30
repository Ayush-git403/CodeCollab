import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Home() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (!username || !roomId) return alert("Enter username and room ID");
    localStorage.setItem("username", username);
    localStorage.setItem("userId", Math.random().toString(36).substring(2));
    navigate(`/room/${roomId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚡ CodeCollab Arena</h1>
        <p style={styles.subtitle}>Race to match the target output</p>

        <input
          style={styles.input}
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Room ID (e.g. ABC123)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
        />
        <button style={styles.button} onClick={joinRoom}>
          Join Room →
        </button>

        <p style={styles.or}>or</p>
        <button
          style={{ ...styles.button, background: "#238636" }}
          onClick={() => navigate("/admin")}
        >
          Create a Room (Admin)
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh", background: "#0D1117",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  card: {
    background: "#161B22", padding: "40px", borderRadius: "12px",
    border: "1px solid #30363D", width: "360px", display: "flex",
    flexDirection: "column", gap: "12px",
  },
  title: { color: "#58A6FF", fontSize: "24px", margin: 0, textAlign: "center" },
  subtitle: { color: "#8B949E", textAlign: "center", margin: 0 },
  input: {
    background: "#0D1117", border: "1px solid #30363D", borderRadius: "6px",
    color: "#C9D1D9", padding: "10px 14px", fontSize: "14px", outline: "none",
  },
  button: {
    background: "#58A6FF", color: "#fff", border: "none", borderRadius: "6px",
    padding: "12px", fontSize: "15px", cursor: "pointer", fontWeight: "bold",
  },
  or: { color: "#8B949E", textAlign: "center", margin: 0 },
};