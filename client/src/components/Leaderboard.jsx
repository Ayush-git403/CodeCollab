export default function Leaderboard({ entries }) {
  return (
    <div style={styles.container}>
      <p style={styles.label}>🏆 Leaderboard</p>
      {entries.length === 0 && <p style={styles.empty}>No submissions yet</p>}
      {entries.map((e, i) => (
        <div key={i} style={{
          ...styles.row,
          background: e.matched ? "#1A2E1A" : "#1A1A2E",
          borderColor: e.matched ? "#3FB950" : "#30363D",
        }}>
          <span style={styles.rank}>#{i + 1}</span>
          <span style={styles.name}>{e.username}</span>
          <span style={{ color: e.matched ? "#3FB950" : "#F78166", fontSize: "12px" }}>
            {e.matched ? "✅ Solved" : "❌ Trying"}
          </span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    background: "#161B22", border: "1px solid #30363D",
    borderRadius: "8px", padding: "16px",
  },
  label: { color: "#E3B341", margin: "0 0 10px 0", fontWeight: "bold", fontSize: "13px" },
  empty: { color: "#8B949E", fontSize: "13px", margin: 0 },
  row: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "8px 12px", borderRadius: "6px", border: "1px solid",
    marginBottom: "6px",
  },
  rank: { color: "#8B949E", fontSize: "12px", width: "24px" },
  name: { color: "#C9D1D9", fontSize: "13px", flex: 1 },
};