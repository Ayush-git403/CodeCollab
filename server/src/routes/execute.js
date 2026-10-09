const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const db = require("../models");

const LANGUAGE_CONFIG = {
  python:     { ext: "py",   cmd: (f) => `python "${f}"` },
  javascript: { ext: "js",   cmd: (f) => `node "${f}"` },
  java:       { ext: "java", cmd: (f) => {
    const dir = path.dirname(f);
    return `cd "${dir}" && javac Main.java && java Main`;
  }},
  cpp:        { ext: "cpp",  cmd: (f) => {
    const out = f.replace(".cpp", ".exe");
    return `g++ "${f}" -o "${out}" && "${out}"`;
  }},
  c:          { ext: "c",    cmd: (f) => {
    const out = f.replace(".c", ".exe");
    return `gcc "${f}" -o "${out}" && "${out}"`;
  }},
};

// Temp folder for code files
const TEMP_DIR = path.join(__dirname, "../../temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

router.post("/run", async (req, res) => {
  const { code, language, roomId, userId, username, targetOutput } = req.body;
  const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG["python"];

  // Java class must be named Main
  const filename = language === "java" ? "Main" : uuidv4();
  const filepath = path.join(TEMP_DIR, `${filename}.${config.ext}`);

  // Write code to temp file
  fs.writeFileSync(filepath, code);

  const command = config.cmd(filepath);

  exec(command, { timeout: 10000 }, async (error, stdout, stderr) => {
    // Clean up temp file
    try { fs.unlinkSync(filepath); } catch {}

    const output = stdout || stderr || error?.message || "No output";
    const matched = targetOutput
      ? output.trim() === targetOutput.trim()
      : false;

    if (roomId && userId) {
      try {
        await db.query(
          `INSERT INTO submissions (room_id, user_id, username, code, output, matched)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [roomId, userId, username, code, output, matched]
        );
      } catch (e) { console.error("DB error:", e.message); }
    }

    res.json({ output, matched });
  });
});

module.exports = router;