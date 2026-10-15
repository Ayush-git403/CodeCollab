const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");


const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#58A6FF",
  "#3FB950",
  "#E3B341",
  "#F78166",
];

// ── SIGNUP ────────────────────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  // Normalize email and username to avoid accidental duplicates
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  try {
    const existing = await db.query(
      `SELECT id, username, email, provider
       FROM users
       WHERE LOWER(email) = $1 OR LOWER(username) = LOWER($2)
       LIMIT 1`,
      [cleanEmail, cleanUsername],
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      if (user.provider) {
        return res.status(409).json({
          error: "This account uses Google or GitHub sign-in.",
        });
      }

      return res.status(409).json({
        error: "Email or username already taken",
      });
    }

    const hash = await bcrypt.hash(password, 12);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, avatar_color)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, avatar_color`,
      [cleanUsername, cleanEmail, hash, color],
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error("Signup error:", err);

    // Handle PostgreSQL unique-constraint violations
    if (err.code === "23505") {
      return res.status(409).json({
        error: "Email or username already taken",
      });
    }

    return res.status(500).json({ error: "Signup failed" });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Case-insensitive, to match the lowercase emails stored by signup/OAuth
    const result = await db.query(
      "SELECT * FROM users WHERE LOWER(email) = $1",
      [email.trim().toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Accounts created via Google/GitHub have no password
    if (!user.password_hash) {
      return res.status(400).json({
        error: "This account uses Google or GitHub sign-in.",
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_color: user.avatar_color,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── VERIFY TOKEN ──────────────────────────────────────────────────────────────
router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await db.query(
      "SELECT id, username, email, avatar_color, created_at FROM users WHERE id = $1",
      [decoded.userId],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ user: result.rows[0] });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;