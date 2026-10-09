import { useRef, useEffect } from "react";

export default function NodeTerminal({ logs, status, previewUrl, onRun, onStop }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const statusColor = {
    idle: "#8B949E",
    booting: "#E3B341",
    installing: "#58A6FF",
    running: "#3FB950",
    error: "#F78166",
  }[status] || "#8B949E";

  const statusLabel = {
    idle: "Ready",
    booting: "Booting...",
    installing: "Installing packages...",
    running: "Running",
    error: "Error",
  }[status] || "Ready";

  const isBusy = status === "booting" || status === "installing";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColor }} />
          <span style={{ fontSize: "11px", fontWeight: "bold", fontFamily: "monospace", color: statusColor }}>
            {statusLabel}
          </span>
          <span style={{ color: "#8B949E", fontSize: "11px" }}>Node.js Environment</span>
        </div>
        <div style={styles.headerRight}>
          {previewUrl ? (
            <a href={previewUrl} target="_blank" rel="noreferrer" style={styles.urlBtn}>
              Open Preview
            </a>
          ) : null}
          {status === "running" ? (
            <button style={styles.stopBtn} onClick={onStop}>Stop</button>
          ) : (
            <button style={{ ...styles.runBtn, opacity: isBusy ? 0.5 : 1 }} onClick={onRun} disabled={isBusy}>
              {isBusy ? "Working..." : "Run Node.js"}
            </button>
          )}
        </div>
      </div>

      <div style={styles.terminal}>
        {logs.length === 0 ? (
          <p style={{ color: "#8B949E", fontSize: "12px", margin: 0, fontStyle: "italic" }}>
            Click Run Node.js to start your server...
          </p>
        ) : null}
        {logs.map((log, i) => (
          <div key={i}>
            <span style={{ color: "#C9D1D9", whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: "12px" }}>
              {log}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {previewUrl ? (
        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid #30363D" }}>
          <div style={{ background: "#161B22", padding: "4px 12px", borderBottom: "1px solid #30363D" }}>
            <span style={{ color: "#58A6FF", fontSize: "11px", fontFamily: "monospace" }}>{previewUrl}</span>
          </div>
          <iframe src={previewUrl} style={{ width: "100%", height: "300px", border: "none", background: "#fff" }} title="Node.js Preview" />
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", background: "#0D1117", border: "1px solid #30363D", borderRadius: "6px", overflow: "hidden", flexShrink: 0 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", background: "#161B22", borderBottom: "1px solid #30363D" },
  headerLeft: { display: "flex", alignItems: "center", gap: "8px" },
  headerRight: { display: "flex", gap: "8px", alignItems: "center" },
  terminal: { padding: "10px 12px", fontFamily: "Fira Code, Consolas, monospace", fontSize: "12px", minHeight: "100px", maxHeight: "180px", overflowY: "auto", background: "#0D1117" },
  runBtn: { background: "#238636", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 12px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  stopBtn: { background: "#F78166", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 12px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" },
  urlBtn: { background: "#21262D", color: "#58A6FF", border: "1px solid #30363D", borderRadius: "4px", padding: "4px 10px", fontSize: "11px", textDecoration: "none" },
};