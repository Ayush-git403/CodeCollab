const rooms = {};
const roomFiles = {};
const fileContents = {};
const db = require("../models");

module.exports = (io) => {
  io.on("connection", (socket) => {
    // Remove this socket from a room's online list and tell everyone else
    const removeFromRoom = (roomId) => {
      if (!rooms[roomId]?.[socket.id]) return;
      delete rooms[roomId][socket.id];
      socket.leave(roomId);
      io.to(roomId).emit("user_joined", {
        users: Object.values(rooms[roomId]),
      });
    };

    socket.on("join_room", async ({ roomId, username, color }) => {
      socket.join(roomId);
      if (!rooms[roomId]) rooms[roomId] = {};
      if (!fileContents[roomId]) fileContents[roomId] = {};

      rooms[roomId][socket.id] = { username, color };

      // Record this user visited this room
      if (color && username) {
        try {
          // Get user ID from DB by username
          const userResult = await db.query(
            "SELECT id FROM users WHERE username = $1",
            [username],
          );
          if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            await db.query(
              `INSERT INTO room_members (room_id, user_id, username)
         VALUES ($1, $2, $3)
         ON CONFLICT (room_id, user_id)
         DO UPDATE SET joined_at = NOW()`,
              [roomId, userId, username],
            );
          }
        } catch (err) {
          console.error("Room member record error:", err.message);
        }
      }

      io.to(roomId).emit("user_joined", {
        users: Object.values(rooms[roomId]),
      });

      // Send files
      if (roomFiles[roomId] && roomFiles[roomId].length > 0) {
        const filesWithContent = roomFiles[roomId].map((f) =>
          f.type === "folder"
            ? f
            : {
                ...f,
                content: fileContents[roomId][f.name] ?? f.content ?? "",
              },
        );
        socket.emit("room_files", filesWithContent);
      } else {
        try {
          const result = await db.query(
            `SELECT filename, language, content
             FROM files WHERE room_id = $1
             ORDER BY saved_at ASC`,
            [roomId],
          );
          if (result.rows.length > 0) {
            // Folders are stored with language = "folder" — restore their type
            // so they come back as folders instead of empty files.
            const dbFiles = result.rows.map((r) =>
              r.language === "folder"
                ? { name: r.filename, type: "folder" }
                : {
                    name: r.filename,
                    language: r.language,
                    content: r.content || "",
                  },
            );
            roomFiles[roomId] = dbFiles;
            dbFiles.forEach((f) => {
              if (f.type !== "folder") {
                fileContents[roomId][f.name] = f.content;
              }
            });
            socket.emit("room_files", dbFiles);
          } else {
            socket.emit("room_not_started");
          }
        } catch (err) {
          console.error("DB load error:", err.message);
          socket.emit("room_not_started");
        }
      }
    });

    // User exits the room (Exit room button, or the room page was closed)
    socket.on("leave_room", ({ roomId }) => removeFromRoom(roomId));

    socket.on("start_project", async ({ roomId, files }) => {
      roomFiles[roomId] = files;
      if (!fileContents[roomId]) fileContents[roomId] = {};
      files.forEach((f) => {
        fileContents[roomId][f.name] = f.content || "";
      });
      for (const f of files) {
        try {
          await db.query(
            `INSERT INTO files (room_id, filename, language, content, saved_by)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (room_id, filename)
             DO UPDATE SET content = $4, saved_at = NOW()`,
            [roomId, f.name, f.language, f.content || "", "system"],
          );
        } catch (err) {
          console.error("Start project save error:", err.message);
        }
      }
      const filesWithContent = files.map((f) => ({
        ...f,
        content: fileContents[roomId][f.name] ?? f.content ?? "",
      }));
      io.to(roomId).emit("room_files", filesWithContent);
    });

    socket.on("code_change", ({ roomId, filename, content }) => {
      if (!fileContents[roomId]) fileContents[roomId] = {};
      fileContents[roomId][filename] = content;
      socket.to(roomId).emit("code_update", { filename, content });
    });

    socket.on("get_file_content", ({ roomId, filename }) => {
      const content = fileContents[roomId]?.[filename] ?? "";
      socket.emit("file_content", { filename, content });
    });

    socket.on("create_file", async ({ roomId, filename, username }) => {
      if (!roomFiles[roomId]) roomFiles[roomId] = [];
      const exists = roomFiles[roomId].find((f) => f.name === filename);
      if (exists) {
        socket.emit("file_error", "A file with that name already exists");
        return;
      }
      const language = getLanguage(filename);
      const newFile = { name: filename, language, content: "" };
      roomFiles[roomId].push(newFile);
      if (!fileContents[roomId]) fileContents[roomId] = {};
      fileContents[roomId][filename] = "";
      try {
        await db.query(
          `INSERT INTO files (room_id, filename, language, content, saved_by)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (room_id, filename) DO NOTHING`,
          [roomId, filename, language, "", username],
        );
      } catch (err) {
        console.error("Create file DB error:", err.message);
      }
      io.to(roomId).emit("file_created", {
        file: newFile,
        createdBy: username,
        message: `${username} created ${filename}`,
      });
    });

    socket.on("delete_file", async ({ roomId, filename, username }) => {
      if (!roomFiles[roomId]) return;
      roomFiles[roomId] = roomFiles[roomId].filter((f) => f.name !== filename);
      if (fileContents[roomId]) delete fileContents[roomId][filename];
      try {
        await db.query(
          `DELETE FROM files WHERE room_id = $1 AND filename = $2`,
          [roomId, filename],
        );
      } catch (err) {
        console.error("Delete file DB error:", err.message);
      }
      io.to(roomId).emit("file_deleted", {
        filename,
        message: `${username} deleted ${filename}`,
      });
    });

    socket.on("rename_file", async ({ roomId, oldName, newName, username }) => {
      if (!roomFiles[roomId]) return;
      const exists = roomFiles[roomId].find((f) => f.name === newName);
      if (exists) {
        socket.emit("file_error", "A file with that name already exists");
        return;
      }
      const file = roomFiles[roomId].find((f) => f.name === oldName);
      if (!file) return;
      file.name = newName;
      file.language = getLanguage(newName);
      if (fileContents[roomId]) {
        fileContents[roomId][newName] = fileContents[roomId][oldName] ?? "";
        delete fileContents[roomId][oldName];
      }
      try {
        await db.query(
          `UPDATE files SET filename = $1, language = $2
           WHERE room_id = $3 AND filename = $4`,
          [newName, file.language, roomId, oldName],
        );
      } catch (err) {
        console.error("Rename DB error:", err.message);
      }
      io.to(roomId).emit("file_renamed", {
        oldName,
        newName,
        language: file.language,
        message: `${username} renamed ${oldName} → ${newName}`,
      });
    });

    socket.on("create_folder", async ({ roomId, folderName, username }) => {
      if (!roomFiles[roomId]) roomFiles[roomId] = [];
      const exists = roomFiles[roomId].find(
        (f) => f.name === folderName && f.type === "folder",
      );
      if (exists) {
        socket.emit("file_error", "A folder with that name already exists");
        return;
      }
      const newFolder = { name: folderName, type: "folder" };
      roomFiles[roomId].push(newFolder);
      try {
        await db.query(
          `INSERT INTO files (room_id, filename, language, content, saved_by)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (room_id, filename) DO NOTHING`,
          [roomId, folderName, "folder", "", username],
        );
      } catch (err) {
        console.error("Create folder DB error:", err.message);
      }
      io.to(roomId).emit("folder_created", {
        folder: newFolder,
        message: `${username} created folder ${folderName}`,
      });
    });

    // ── Persistent chat ──────────────────────────────────────────────────────
    socket.on("chat_message", async ({ roomId, username, message }) => {
      const createdAt = new Date().toISOString();
      try {
        await db.query(
          `INSERT INTO chat_messages (room_id, username, message, created_at)
           VALUES ($1, $2, $3, $4)`,
          [roomId, username, message, createdAt],
        );
        console.log(`💬 [${roomId}] ${username}: ${message}`);
      } catch (err) {
        console.error("Chat save error:", err.message);
      }
      io.to(roomId).emit("chat_message", { username, message, createdAt });
    });

    socket.on("disconnect", () => {
      for (const roomId in rooms) removeFromRoom(roomId);
    });
  });
};

function getLanguage(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    py: "python",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    cpp: "cpp",
    c: "c",
    java: "java",
    json: "json",
    md: "markdown",
    txt: "plaintext",
  };
  return map[ext] || "plaintext";
}