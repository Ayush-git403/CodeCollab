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

// POST /api/revisions/:roomId/unreviewed
// body: { seen: { "routes/index.js": 12, "App.jsx": 7 } }
// Returns every listed file that has saves newer than what the user reviewed.
router.post("/:roomId/unreviewed", async (req, res) => {
  const { roomId } = req.params;
  const seen       = req.body.seen || {};

  const filenames = Object.keys(seen).filter((n) => Number.isFinite(Number(seen[n])));
  if (filenames.length === 0) return res.json({ files: {} });

  try {
    const minSeen = Math.min(...filenames.map((n) => Number(seen[n])));

    const rows = await db.query(
      `SELECT id, filename, saved_by FROM file_revisions
       WHERE room_id = $1
         AND filename = ANY($2::text[])
         AND id > $3
         AND saved_by <> '__baseline__'
       ORDER BY id ASC`,
      [roomId, filenames, minSeen]
    );

    const files = {};
    for (const r of rows.rows) {
      const id = Number(r.id);
      if (id <= Number(seen[r.filename])) continue; // already reviewed this one
      const entry = files[r.filename] || { authors: [], latestId: 0 };
      if (!entry.authors.includes(r.saved_by)) entry.authors.push(r.saved_by);
      entry.latestId = Math.max(entry.latestId, id);
      files[r.filename] = entry;
    }

    res.json({ files });
  } catch (err) {
    console.error("Unreviewed check error:", err.message);
    res.status(500).json({ error: "Failed to check changes" });
  }
});

module.exports = { router, seedBaseline };