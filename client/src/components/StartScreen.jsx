import { useState } from "react";

const TEMPLATES = [
  {
    id: "blank",
    icon: "📄",
    label: "Blank File",
    desc: "Start from scratch with any language",
    files: [],
  },
  {
    id: "html",
    icon: "🌐",
    label: "Web Page",
    desc: "HTML + CSS + JS starter",
    files: [
      {
        name: "index.html",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My Page</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Hello World</h1>
  <p>Edit this file to get started.</p>
  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        name: "style.css",
        language: "css",
        content: `body {
  font-family: sans-serif;
  background: #f5f5f5;
  color: #333;
  margin: 0;
  padding: 40px;
}

h1 {
  color: #2563eb;
}`,
      },
      {
        name: "script.js",
        language: "javascript",
        content: `// Your JavaScript here
console.log("Page loaded!");`,
      },
    ],
  },
  {
    id: "python",
    icon: "🐍",
    label: "Python Script",
    desc: "Python starter file",
    files: [
      {
        name: "main.py",
        language: "python",
        content: `# Python Script
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`,
      },
    ],
  },
  {
    id: "javascript",
    icon: "🟨",
    label: "JavaScript",
    desc: "Node.js script starter",
    files: [
      {
        name: "index.js",
        language: "javascript",
        content: `// JavaScript Script
function main() {
  console.log("Hello, World!");
}

main();`,
      },
    ],
  },
  {
    id: "cpp",
    icon: "⚙️",
    label: "C++ Program",
    desc: "C++ starter with main()",
    files: [
      {
        name: "main.cpp",
        language: "cpp",
        content: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
      },
    ],
  },
  {
    id: "java",
    icon: "☕",
    label: "Java Program",
    desc: "Java class with main method",
    files: [
      {
        name: "Main.java",
        language: "java",
        content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      },
    ],
  },
  {
    id: "fullstack",
    icon: "🚀",
    label: "Full Project",
    desc: "HTML + CSS + Python backend starter",
    files: [
      {
        name: "index.html",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>My Project</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <div class="container">
    <h1>My Project</h1>
  </div>
</body>
</html>`,
      },
      {
        name: "style.css",
        language: "css",
        content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; background: #0f172a; color: #e2e8f0; }
.container { max-width: 800px; margin: 60px auto; padding: 0 20px; }
h1 { font-size: 2rem; color: #60a5fa; }`,
      },
      {
        name: "main.py",
        language: "python",
        content: `# Backend logic here
def process():
    return "Hello from Python!"

print(process())`,
      },
      {
        name: "README.md",
        language: "markdown",
        content: `# My Project

## Description
Add your project description here.

## How to run
- Open index.html for the frontend preview
- Run main.py for backend logic`,
      },
    ],
  },
];

export default function StartScreen({ roomName, onStart }) {
  const [selected, setSelected]   = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customLang, setCustomLang] = useState("python");

  const LANG_EXT = {
    python: "py", javascript: "js", cpp: "cpp",
    java: "java", c: "c", html: "html",
    css: "css", markdown: "md", plaintext: "txt",
  };

  const handleStart = () => {
    if (!selected) return;
    if (selected.id === "blank") {
      setShowCustom(true);
      return;
    }
    onStart(selected.files);
  };

  const handleCustomCreate = () => {
    if (!customName.trim()) return;
    const ext = LANG_EXT[customLang] || "txt";
    const filename = customName.includes(".")
      ? customName
      : `${customName}.${ext}`;
    onStart([{ name: filename, language: customLang, content: "" }]);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <p style={styles.roomTag}>🏠 {roomName}</p>
          <h1 style={styles.title}>Start Your Project</h1>
          <p style={styles.sub}>
            Pick a template or start blank — you can add more files anytime
          </p>
        </div>

        {!showCustom ? (
          <>
            {/* Template grid */}
            <div style={styles.grid}>
              {TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  style={{
                    ...styles.card,
                    ...(selected?.id === t.id ? styles.cardActive : {}),
                  }}
                  onClick={() => setSelected(t)}
                >
                  <span style={styles.cardIcon}>{t.icon}</span>
                  <p style={styles.cardLabel}>{t.label}</p>
                  <p style={styles.cardDesc}>{t.desc}</p>
                  {t.files.length > 0 && (
                    <div style={styles.fileList}>
                      {t.files.map((f) => (
                        <span key={f.name} style={styles.filePill}>
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              style={{
                ...styles.startBtn,
                opacity: selected ? 1 : 0.4,
                cursor: selected ? "pointer" : "not-allowed",
              }}
              onClick={handleStart}
              disabled={!selected}
            >
              {selected?.id === "blank"
                ? "Create Custom File →"
                : `Start with ${selected?.label || "..."} →`}
            </button>
          </>
        ) : (
          /* Custom blank file creator */
          <div style={styles.customBox}>
            <p style={styles.customTitle}>📄 Create Your First File</p>
            <p style={styles.customSub}>
              Name your file and pick a language. You can add more files later.
            </p>
            <input
              autoFocus
              style={styles.input}
              placeholder="filename — e.g. app, solution, index"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomCreate()}
            />
            <select
              style={styles.input}
              value={customLang}
              onChange={(e) => setCustomLang(e.target.value)}
            >
              <option value="python">Python (.py)</option>
              <option value="javascript">JavaScript (.js)</option>
              <option value="html">HTML (.html)</option>
              <option value="css">CSS (.css)</option>
              <option value="cpp">C++ (.cpp)</option>
              <option value="java">Java (.java)</option>
              <option value="c">C (.c)</option>
              <option value="markdown">Markdown (.md)</option>
              <option value="plaintext">Plain Text (.txt)</option>
            </select>
            <div style={styles.btnRow}>
              <button
                style={styles.backBtn}
                onClick={() => setShowCustom(false)}
              >
                ← Back
              </button>
              <button
                style={styles.startBtn}
                onClick={handleCustomCreate}
              >
                Create File →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#0D1117",
    minHeight: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 20px",
  },
  container: {
    width: "100%",
    maxWidth: "780px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  header: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  roomTag: {
    color: "#58A6FF",
    fontSize: "13px",
    fontWeight: "bold",
    margin: 0,
  },
  title: {
    color: "#E6EDF3",
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
  },
  sub: {
    color: "#8B949E",
    fontSize: "14px",
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  card: {
    background: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "10px",
    padding: "16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  cardActive: {
    border: "2px solid #58A6FF",
    background: "#1C2A3A",
  },
  cardIcon: { fontSize: "22px" },
  cardLabel: {
    color: "#E6EDF3",
    fontWeight: "bold",
    fontSize: "14px",
    margin: 0,
  },
  cardDesc: {
    color: "#8B949E",
    fontSize: "12px",
    margin: 0,
    lineHeight: "1.5",
  },
  fileList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "4px",
  },
  filePill: {
    background: "#21262D",
    color: "#58A6FF",
    fontSize: "10px",
    padding: "2px 7px",
    borderRadius: "20px",
    fontFamily: "monospace",
    border: "1px solid #30363D",
  },
  startBtn: {
    background: "#238636",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
  },
  customBox: {
    background: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "10px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  customTitle: {
    color: "#E6EDF3",
    fontWeight: "bold",
    fontSize: "18px",
    margin: 0,
  },
  customSub: {
    color: "#8B949E",
    fontSize: "13px",
    margin: 0,
  },
  input: {
    background: "#0D1117",
    border: "1px solid #30363D",
    borderRadius: "6px",
    color: "#C9D1D9",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
  },
  btnRow: {
    display: "flex",
    gap: "10px",
  },
  backBtn: {
    background: "#21262D",
    color: "#C9D1D9",
    border: "1px solid #30363D",
    borderRadius: "6px",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "14px",
  },
};