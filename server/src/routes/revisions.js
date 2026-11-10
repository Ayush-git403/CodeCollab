const express = require("express");
const router  = express.Router();
const db      = require("../db"); // same require as your room.js

// Store the file's current content as the "before" version the first time
// anyone opens or saves it, so there is always something to compare against.
async function seedBaseline(roomId, filename) {
  await db.query(
    `INSERT INTO file_revisions (room_id, filename, content, saved_by)
     SELECT $1::text, $2::text,
            COALESCE((SELECT content FROM files
                      WHERE room_id = $1::text AND filename = $2::text), ''),
            '__baseline__'
     WHERE NOT EXISTS (
       SELECT 1 FROM file_revisions
       WHERE room_id = $1::text AND filename = $2::text
     )`,
    [roomId, filename]
  );
}

// POST /api/revisions/:roomId/open
// body: { filename, since }  (since = last revision id this user reviewed, or null)
router.post("/:roomId/open", async (req, res) => {
  const { roomId }   = req.params;
  const { filename } = req.body;
  const since        = req.body.since;

  if (!filename) return res.status(400).json({ error: "filename required" });

  try {
    await seedBaseline(roomId, filename);

    const latest = await db.query(
      `SELECT id, content FROM file_revisions
       WHERE room_id = $1 AND filename = $2
       ORDER BY id DESC LIMIT 1`,
      [roomId, filename]
    );
    const latestRow = latest.rows[0];
    const latestId  = Number(latestRow.id);

    // First time this user sees the file: nothing to compare against
    if (since === null || since === undefined) {
      return res.json({ latestId, changes: [], base: null, current: null });
    }

    // Version the user last reviewed (falls back to the oldest stored version)
    let base = await db.query(
      `SELECT id, content FROM file_revisions
       WHERE room_id = $1 AND filename = $2 AND id <= $3
       ORDER BY id DESC LIMIT 1`,
      [roomId, filename, Number(since)]
    );
    if (base.rows.length === 0) {
      base = await db.query(
        `SELECT id, content FROM file_revisions
         WHERE room_id = $1 AND filename = $2
         ORDER BY id ASC LIMIT 1`,
        [roomId, filename]
      );
    }
    const baseRow = base.rows[0];

    const changes = await db.query(
      `SELECT id, saved_by, created_at FROM file_revisions
       WHERE room_id = $1 AND filename = $2
         AND id > $3 AND saved_by <> '__baseline__'
       ORDER BY id ASC`,
      [roomId, filename, Number(baseRow.id)]
    );

    res.json({
      latestId,
      base:    baseRow.content,
      current: latestRow.content,
      changes: changes.rows.map((r) => ({
        id:        Number(r.id),
        savedBy:   r.saved_by,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error("Revision open error:", err.message);
    res.status(500).json({ error: "Failed to load changes" });
  }
});

module.exports = { router, seedBaseline };