const express = require("express");
const router  = express.Router();
const db      = require("../db");

// Create room
router.post("/create", async (req, res) => {
  const { name, targetOutput, language, timeLimit } = req.body;
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

  await db.query(
    `INSERT INTO rooms (id, name, target_output, target_type, language, time_limit)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [roomId, name, targetOutput || "", "terminal", language || "python", timeLimit || 0]
  );

  res.json({ roomId });
});

// Get room
router.get("/:roomId", async (req, res) => {
  const room = await db.query(
    `SELECT * FROM rooms WHERE id = $1`,
    [req.params.roomId]
  );
  if (room.rows.length === 0) return res.status(404).json({ error: "Room not found" });
  res.json(room.rows[0]);
});

// Save file
router.post("/save", async (req, res) => {
  const { roomId, filename, language, content, savedBy } = req.body;
  try {
    await db.query(
      `INSERT INTO files (room_id, filename, language, content, saved_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_id, filename)
       DO UPDATE SET content = $4, saved_by = $5, saved_at = NOW()`,
      [roomId, filename, language, content, savedBy]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Save error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Load all files for a room
router.get("/:roomId/files", async (req, res) => {
  const files = await db.query(
    `SELECT filename, language, content FROM files
     WHERE room_id = $1 ORDER BY saved_at ASC`,
    [req.params.roomId]
  );
  res.json(files.rows);
});

// Leaderboard
router.get("/:roomId/leaderboard", async (req, res) => {
  const board = await db.query(
    `SELECT username, matched, submitted_at FROM submissions
     WHERE room_id = $1 ORDER BY matched DESC, submitted_at ASC`,
    [req.params.roomId]
  );
  res.json(board.rows);
});

module.exports = router;