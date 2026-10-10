import { useState } from "react";
import axios from "axios";

export default function AIPanel({ code, language, targetOutput }) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");

  const ask = async (type) => {
    setLoading(true);
    setResponse("");
    try {
      let res;
      if (type === "explain") {
        res = await axios.post("https://codecollab-d0p4.onrender.com/api/ai/explain", { code, language });
        setResponse(res.data.explanation);
      } else if (type === "hint") {
        res = await axios.post("https://codecollab-d0p4.onrender.com/api/ai/hint", { userCode: code, targetOutput, language });
        setResponse(res.data.hint);
      } else if (type === "memory") {
        const userId = localStorage.getItem("userId");
        res = await axios.post("https://codecollab-d0p4.onrender.com/api/ai/memory", { userId, currentCode: code, question });
        setResponse(res.data.response);
      }
    } catch (e) {
      setResponse("AI request failed. Check your API key.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <p style={styles.label}>🤖 AI Assistant</p>
      <div style={styles.buttons}>
        <button style={styles.btn} onClick={() => ask("explain")}>Explain Code</button>
        <button style={styles.btn} onClick={() => ask("hint")}>Get Hint</button>
      </div>
      <input style={styles.input} placeholder="Ask anything about your code..."
        value={question} onChange={(e) => setQuestion(e.target.value)} />
      <button style={{ ...styles.btn, width: "100%" }} onClick={() => ask("memory")}>
        Ask AI (with memory)
      </button>
      {loading && <p style={styles.loading}>Thinking...</p>}
      {response && <pre style={styles.response}>{response}</pre>}
    </div>
  );
}

const styles = {
  container: {
    background: "#161B22", border: "1px solid #30363D",
    borderRadius: "8px", padding: "16px", display: "flex",
    flexDirection: "column", gap: "8px",
  },
  label: { color: "#58A6FF", margin: 0, fontWeight: "bold", fontSize: "13px" },
  buttons: { display: "flex", gap: "8px" },
  btn: {
    background: "#21262D", color: "#C9D1D9", border: "1px solid #30363D",
    borderRadius: "6px", padding: "7px 12px", cursor: "pointer", fontSize: "12px",
  },
  input: {
    background: "#0D1117", border: "1px solid #30363D", borderRadius: "6px",
    color: "#C9D1D9", padding: "8px", fontSize: "13px", outline: "none",
  },
  loading: { color: "#8B949E", fontSize: "12px", margin: 0 },
  response: {
    color: "#C9D1D9", fontSize: "12px", background: "#0D1117",
    padding: "12px", borderRadius: "6px", whiteSpace: "pre-wrap",
    maxHeight: "200px", overflowY: "auto", margin: 0,
  },
};