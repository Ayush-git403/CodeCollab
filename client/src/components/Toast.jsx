import { useEffect, useState } from "react";

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div style={styles.toast}>
      <span style={styles.icon}>📄</span>
      <span style={styles.msg}>{message}</span>
    </div>
  );
}

const styles = {
  toast: {
    position: "fixed",
    bottom: "32px",
    right: "24px",
    background: "#21262D",
    border: "1px solid #3FB950",
    borderRadius: "8px",
    padding: "12px 18px",
    color: "#C9D1D9",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    zIndex: 9999,
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
  },
  icon: { fontSize: "16px" },
  msg:  { color: "#C9D1D9", fontSize: "13px" },
};