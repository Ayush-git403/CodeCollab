const db = require("../db"); // same require as your room.js
const { seedBaseline } = require("../routes/revisions");

module.exports = function registerChangeTracker(io, socket) {
  socket.on("save_file", async (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const { roomId, filename, language, content, username } = payload || {};

    if (!roomId || !filename) {
      return reply({ ok: false, error: "Missing roomId or filename" });
    }

    try {
      // Must run BEFORE the files table is overwritten below
      await seedBaseline(roomId, filename);

      await db.query(
        `INSERT INTO files (room_id, filename, language, content, saved_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (room_id, filename)
         DO UPDATE SET content = $4, saved_by = $5, saved_at = NOW()`,
        [roomId, filename, language, content, username]
      );

      const latest = await db.query(
        `SELECT id, content FROM file_revisions
         WHERE room_id = $1 AND filename = $2
         ORDER BY id DESC LIMIT 1`,
        [roomId, filename]
      );
      const previous = latest.rows[0];

      // Pressing Save with no actual change: no revision, no popup
      if (previous.content === content) {
        return reply({ ok: true, unchanged: true, revisionId: Number(previous.id) });
      }

      const inserted = await db.query(
        `INSERT INTO file_revisions (room_id, filename, content, saved_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id, created_at`,
        [roomId, filename, content, username]
      );
      const revisionId = Number(inserted.rows[0].id);

      // Everyone else in the room gets the popup
      socket.to(roomId).emit("file_changed", {
        filename,
        savedBy: username,
        revisionId,
        previousRevisionId: Number(previous.id),
        createdAt: inserted.rows[0].created_at,
      });

      reply({ ok: true, unchanged: false, revisionId });
    } catch (err) {
      console.error("save_file error:", err.message);
      reply({ ok: false, error: "Save failed" });
    }
  });
};