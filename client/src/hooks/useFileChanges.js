import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { socket } from "../socket";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const seenKey = (roomId, username, filename) =>
  `seen_${roomId}_${username}_${filename}`;

function readSeen(roomId, username, filename) {
  const raw = localStorage.getItem(seenKey(roomId, username, filename));
  return raw === null ? null : Number(raw);
}

function writeSeen(roomId, username, filename, revisionId) {
  localStorage.setItem(seenKey(roomId, username, filename), String(revisionId));
}

export default function useFileChanges({ roomId, username }) {
  const [notices, setNotices]         = useState([]);
  const [pending, setPending]         = useState({});
  const [diff, setDiff]               = useState(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const pendingRef = useRef({});
  useEffect(() => { pendingRef.current = pending; }, [pending]);

  const pushNotice = useCallback((filename, savedBy, kind) => {
    setNotices((prev) => [
      ...prev.filter((n) => n.filename !== filename),
      { id: `${filename}-${Date.now()}`, filename, savedBy, kind },
    ].slice(-4));
  }, []);

  const dismissNotice = useCallback((id) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Someone else saved a file
  useEffect(() => {
    const onFileChanged = ({ filename, savedBy, revisionId, previousRevisionId }) => {
      // Never viewed this file? Use the version before this save as the baseline
      if (readSeen(roomId, username, filename) === null && previousRevisionId != null) {
        writeSeen(roomId, username, filename, previousRevisionId);
      }
      setPending((prev) => {
        const current = prev[filename] || { authors: [], latestId: 0 };
        return {
          ...prev,
          [filename]: {
            authors: current.authors.includes(savedBy)
              ? current.authors
              : [...current.authors, savedBy],
            latestId: revisionId,
          },
        };
      });
      pushNotice(filename, savedBy, "live");
    };

    socket.on("file_changed", onFileChanged);
    return () => socket.off("file_changed", onFileChanged);
  }, [roomId, username, pushNotice]);

  // Call whenever a file becomes the active file
  const checkFile = useCallback(async (filename) => {
    if (!roomId || !filename) return;
    const seen = readSeen(roomId, username, filename);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/revisions/${roomId}/open`,
        { filename, since: seen }
      );

      if (seen === null) {
        writeSeen(roomId, username, filename, data.latestId);
        return;
      }

      if (data.changes.length > 0) {
        const authors = [...new Set(data.changes.map((c) => c.savedBy))];
        setPending((prev) => ({ ...prev, [filename]: { authors, latestId: data.latestId } }));
        pushNotice(filename, authors.join(", "), "unseen");
      } else {
        setPending((prev) => {
          if (!prev[filename]) return prev;
          const next = { ...prev };
          delete next[filename];
          return next;
        });
      }
    } catch (err) {
      console.error("checkFile failed:", err.message);
    }
  }, [roomId, username, pushNotice]);

  const openDiff = useCallback(async (filename) => {
    setDiffLoading(true);
    setDiff(null);
    try {
      const seen = readSeen(roomId, username, filename);
      const { data } = await axios.post(
        `${API_URL}/api/revisions/${roomId}/open`,
        { filename, since: seen }
      );
      setDiff({
        filename,
        base:     data.base ?? "",
        current:  data.current ?? "",
        changes:  data.changes,
        latestId: data.latestId,
      });
    } catch (err) {
      console.error("openDiff failed:", err.message);
    }
    setDiffLoading(false);
  }, [roomId, username]);

  const closeDiff = useCallback(() => {
    setDiff(null);
    setDiffLoading(false);
  }, []);

  const markReviewed = useCallback((filename, latestId) => {
    writeSeen(roomId, username, filename, latestId);
    setPending((prev) => {
      const next = { ...prev };
      delete next[filename];
      return next;
    });
    setNotices((prev) => prev.filter((n) => n.filename !== filename));
    setDiff(null);
  }, [roomId, username]);

  // Manual save: persists the file AND records a revision
  const saveFile = useCallback(({ filename, language, content }) =>
    new Promise((resolve) => {
      socket.timeout(8000).emit(
        "save_file",
        { roomId, filename, language, content, username },
        (err, res) => {
          if (err || !res?.ok) {
            return resolve({ ok: false, error: err?.message || res?.error });
          }
          // Only move "last reviewed" forward if nothing is waiting for review
          if (!pendingRef.current[filename]) {
            writeSeen(roomId, username, filename, res.revisionId);
          }
          resolve({ ok: true, unchanged: !!res.unchanged });
        }
      );
    }), [roomId, username]);

  return {
    notices, pending, diff, diffLoading,
    checkFile, saveFile, openDiff, closeDiff, markReviewed, dismissNotice,
  };
}