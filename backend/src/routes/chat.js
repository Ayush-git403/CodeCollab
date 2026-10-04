const express = require("express");
const router  = express.Router();
const db      = require("../models");

// GET /api/chat/:roomId?before=<ISO_TIMESTAMP>&limit=50
// - No `before` param → fetch latest 50 messages
// - With `before`     → fetch 50 messages older than that timestamp (scroll up)
router.get("/:roomId", async (req, res) => {
  try {
    const { before, limit = 50 } = req.query;
    const pageSize = Math.min(parseInt(limit), 100);

    let result;
    if (before) {
      // Cursor-based: fetch messages older than `before` timestamp
      result = await db.query(
        `SELECT id, username, message, created_at
         FROM chat_messages
         WHERE room_id = $1
           AND created_at < $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [req.params.roomId, before, pageSize]
      );
    } else {
      // Initial load: fetch latest messages
      result = await db.query(
        `SELECT id, username, message, created_at
         FROM chat_messages
         WHERE room_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [req.params.roomId, pageSize]
      );
    }

    // Reverse so oldest is first (chronological order for display)
    const messages = result.rows.reverse();

    // Tell frontend if there are more older messages to load
    let hasMore = false;
    if (messages.length > 0) {
      const oldest = messages[0].created_at;
      const countResult = await db.query(
        `SELECT COUNT(*) FROM chat_messages
         WHERE room_id = $1 AND created_at < $2`,
        [req.params.roomId, oldest]
      );
      hasMore = parseInt(countResult.rows[0].count) > 0;
    }

    res.json({ messages, hasMore });
  } catch (err) {
    console.error("Chat fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;