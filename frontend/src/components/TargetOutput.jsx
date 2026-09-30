export default function TargetOutput({ target }) {
  return (
    <div style={styles.container}>
      <p style={styles.label}>🎯 Target Output</p>
      <pre style={styles.pre}>{target || "Loading..."}</pre>
    </div>
  );
}

const styles = {
  container: {
    background: "#161B22", border: "1px solid #30363D",
    borderRadius: "8px", padding: "16px",
  },
  label: { color: "#58A6FF", margin: "0 0 8px 0", fontWeight: "bold", fontSize: "13px" },
  pre: {
    color: "#3FB950", margin: 0, fontFamily: "monospace",
    fontSize: "13px", whiteSpace: "pre-wrap", wordBreak: "break-all",
  },
};