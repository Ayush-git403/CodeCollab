// backend/routes/oauth.js
// Google + GitHub OAuth (authorization-code flow, no passport needed).
// Matches your existing auth.js: db = require("../models"), JWT payload { userId, username }.
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../models");

const router = express.Router();

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
  "#98D8C8", "#F7DC6F", "#58A6FF", "#3FB950", "#E3B341", "#F78166",
];

const API_URL = process.env.API_URL; // https://codecollab-d0p4.onrender.com
const FRONTEND_URL = process.env.FRONTEND_URL; // https://code-collab-seven-lake.vercel.app

/* ---------- helpers ---------- */

// Same payload as auth.js login/signup
const signToken = (user) =>
  jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

// Same shape as auth.js login returns
const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  avatar_color: u.avatar_color,
});

const readCookie = (req, name) =>
  (req.headers.cookie || "")
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([k]) => k === name)?.[1];

// CSRF protection: random state, stored in an httpOnly cookie and echoed back by the provider
function beginAuth(res, authUrl, params) {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: (API_URL || "").startsWith("https"),
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });
  res.redirect(`${authUrl}?${new URLSearchParams({ ...params, state })}`);
}

function checkState(req, res) {
  const ok = req.query.state && req.query.state === readCookie(req, "oauth_state");
  res.clearCookie("oauth_state");
  return ok;
}

async function uniqueUsername(base) {
  const clean = (base || "user").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) || "user";
  let name = clean;
  for (;;) {
    const { rowCount } = await db.query("SELECT 1 FROM users WHERE LOWER(username) = LOWER($1)", [name]);
    if (!rowCount) return name;
    name = `${clean}${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

// Find by provider id -> else link to existing account by verified email -> else create
async function findOrCreateUser({ provider, providerId, email, emailVerified, name }) {
  const byProvider = await db.query(
    "SELECT * FROM users WHERE provider = $1 AND provider_id = $2",
    [provider, providerId],
  );
  if (byProvider.rows[0]) return byProvider.rows[0];

  if (!email || !emailVerified) throw new Error("No verified email on provider account");
  const cleanEmail = email.trim().toLowerCase();

  // Link to an existing password account that uses the same (verified) email
  const linked = await db.query(
    `UPDATE users
        SET provider = COALESCE(provider, $1),
            provider_id = COALESCE(provider_id, $2)
      WHERE LOWER(email) = $3
      RETURNING *`,
    [provider, providerId, cleanEmail],
  );
  if (linked.rows[0]) return linked.rows[0];

  const created = await db.query(
    `INSERT INTO users (username, email, provider, provider_id, avatar_color)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      await uniqueUsername(name || cleanEmail.split("@")[0]),
      cleanEmail,
      provider,
      providerId,
      COLORS[Math.floor(Math.random() * COLORS.length)],
    ],
  );
  return created.rows[0];
}

function finish(res, user) {
  const token = signToken(user);
  const userB64 = Buffer.from(JSON.stringify(publicUser(user))).toString("base64url");
  // Fragment (#) is never sent to servers or logged in request URLs
  res.redirect(`${FRONTEND_URL}/oauth/callback#token=${token}&user=${userB64}`);
}

const fail = (res, err) => {
  console.error("OAuth error:", err);
  res.redirect(`${FRONTEND_URL}/login?error=oauth`);
};

/* ---------- Google ---------- */

router.get("/google", (req, res) =>
  beginAuth(res, "https://accounts.google.com/o/oauth2/v2/auth", {
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${API_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
  }),
);

router.get("/google/callback", async (req, res) => {
  try {
    if (!req.query.code || !checkState(req, res)) throw new Error("Bad state or code");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${API_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error("Google token exchange failed");

    const profile = await (
      await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
    ).json();

    const user = await findOrCreateUser({
      provider: "google",
      providerId: profile.sub,
      email: profile.email,
      emailVerified: profile.email_verified,
      name: profile.name,
    });
    finish(res, user);
  } catch (err) {
    fail(res, err);
  }
});

/* ---------- GitHub ---------- */

router.get("/github", (req, res) =>
  beginAuth(res, "https://github.com/login/oauth/authorize", {
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${API_URL}/api/auth/github/callback`,
    scope: "read:user user:email",
  }),
);

router.get("/github/callback", async (req, res) => {
  try {
    if (!req.query.code || !checkState(req, res)) throw new Error("Bad state or code");

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: req.query.code,
        redirect_uri: `${API_URL}/api/auth/github/callback`,
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error("GitHub token exchange failed");

    const headers = {
      Authorization: `Bearer ${tokens.access_token}`,
      "User-Agent": "codecollab-arena",
      Accept: "application/vnd.github+json",
    };
    const profile = await (await fetch("https://api.github.com/user", { headers })).json();
    const emails = await (await fetch("https://api.github.com/user/emails", { headers })).json();
    const primary = Array.isArray(emails) && emails.find((e) => e.primary && e.verified);

    const user = await findOrCreateUser({
      provider: "github",
      providerId: String(profile.id),
      email: primary?.email,
      emailVerified: !!primary,
      name: profile.login,
    });
    finish(res, user);
  } catch (err) {
    fail(res, err);
  }
});

module.exports = router;