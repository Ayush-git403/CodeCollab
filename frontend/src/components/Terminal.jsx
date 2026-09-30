export default function Terminal({ output, matched }) {
  return (
    <div style={styles.container}>
      <p style={styles.label}>
        💻 Output {matched !== null && (
          <span style={{ color: matched ? "#3FB950" : "#F78166" }}>
            {matched ? "✅ Matched!" : "❌ Not matched"}
          </span>
        )}
      </p>
      <pre style={styles.pre}>{output || "Run your code to see output..."}</pre>
    </div>
  );
}

const styles = {
  container: {
    background: "#0D1117", border: "1px solid #30363D",
    borderRadius: "8px", padding: "16px",
  },
  label: { color: "#8B949E", margin: "0 0 8px 0", fontSize: "13px", fontWeight: "bold" },
  pre: {
    color: "#C9D1D9", margin: 0, fontFamily: "monospace",
    fontSize: "13px", whiteSpace: "pre-wrap",
  },
};