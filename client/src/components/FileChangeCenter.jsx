import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DiffEditor } from "@monaco-editor/react";

const LANG_BY_EXT = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", html: "html", css: "css", json: "json",
  md: "markdown", java: "java", cpp: "cpp", c: "c",
};

const languageOf = (filename) =>
  LANG_BY_EXT[filename.split(".").pop().toLowerCase()] || "plaintext";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10)    return "just now";
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function Notice({ notice, onView, onDismiss }) {
  // "Someone just saved" popups fade after 15s; "unreviewed" ones stay until handled
  useEffect(() => {
    if (notice.kind !== "live") return;
    const t = setTimeout(() => onDismiss(notice.id), 15000);
    return () => clearTimeout(t);
  }, [notice.id, notice.kind, onDismiss]);

  const title = notice.kind === "live"
    ? `${notice.savedBy} saved changes`
    : "Changes since you last viewed this file";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.2 }}
      style={S.notice}
    >
      <div style={S.noticeBar} />
      <div style={S.noticeBody}>
        <p style={S.noticeTitle}>{title}</p>
        <p style={S.noticeFile}>{notice.filename}</p>
        {notice.kind === "unseen" && (
          <p style={S.noticeSub}>Changed by {notice.savedBy}</p>
        )}
        <div style={S.noticeActions}>
          <button style={S.primaryBtn} onClick={() => onView(notice)}>
            View changes
          </button>
          <button style={S.ghostBtn} onClick={() => onDismiss(notice.id)}>
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DiffModal({ diff, loading, onClose, onReviewed }) {
  const [sideBySide, setSideBySide] = useState(true);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasChanges = diff && diff.changes.length > 0;
  const authors    = hasChanges ? [...new Set(diff.changes.map((c) => c.savedBy))] : [];
  const last       = hasChanges ? diff.changes[diff.changes.length - 1] : null;

  return (
    <div style={S.backdrop} onMouseDown={onClose}>
      <div style={S.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div>
            <p style={S.modalTitle}>
              {diff ? `Changes in ${diff.filename}` : "Loading changes..."}
            </p>
            {hasChanges && (
              <p style={S.modalSub}>
                {authors.join(", ")} · {diff.changes.length} save
                {diff.changes.length > 1 ? "s" : ""} · {timeAgo(last.createdAt)}
              </p>
            )}
          </div>

          <div style={S.modalActions}>
            {hasChanges && (
              <>
                <span style={S.legend}>
                  <span style={{ ...S.swatch, background: "#2ea043" }} /> added
                  <span style={{ ...S.swatch, background: "#f85149", marginLeft: 10 }} /> removed
                </span>
                <button style={S.ghostBtn} onClick={() => setSideBySide((v) => !v)}>
                  {sideBySide ? "Inline view" : "Side by side"}
                </button>
              </>
            )}
            <button style={S.ghostBtn} onClick={onClose}>Close</button>
            {hasChanges && (
              <button
                style={S.primaryBtn}
                onClick={() => onReviewed(diff.filename, diff.latestId)}
              >
                Mark as reviewed
              </button>
            )}
          </div>
        </div>

        <div style={S.modalBody}>
          {loading && !diff && <p style={S.emptyText}>Loading...</p>}

          {diff && !hasChanges && (
            <p style={S.emptyText}>No saved changes to review for this file.</p>
          )}

          {hasChanges && (
            <DiffEditor
              height="100%"
              original={diff.base}
              modified={diff.current}
              language={languageOf(diff.filename)}
              theme="vs-dark"
              options={{
                readOnly: true,
                originalEditable: false,
                renderSideBySide: sideBySide,
                useInlineViewWhenSpaceIsLimited: false,
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                fontFamily: "Fira Code, Consolas, monospace",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function FileChangeCenter({ changes }) {
  const {
    notices, diff, diffLoading,
    openDiff, closeDiff, markReviewed, dismissNotice,
  } = changes;

  const handleView = (notice) => {
    dismissNotice(notice.id);
    openDiff(notice.filename);
  };

  return (
    <>
      <div style={S.stack}>
        <AnimatePresence>
          {notices.map((n) => (
            <Notice key={n.id} notice={n} onView={handleView} onDismiss={dismissNotice} />
          ))}
        </AnimatePresence>
      </div>

      {(diff || diffLoading) && (
        <DiffModal
          diff={diff}
          loading={diffLoading}
          onClose={closeDiff}
          onReviewed={markReviewed}
        />
      )}
    </>
  );
}

const S = {
  stack: {
    position: "fixed", left: 16, bottom: 40, zIndex: 1500,
    display: "flex", flexDirection: "column", gap: 8, width: 340,
  },
  notice: {
    display: "flex", background: "#161B22",
    border: "1px solid #30363D", borderRadius: 10,
    overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
  },
  noticeBar:   { width: 4, background: "#58A6FF", flexShrink: 0 },
  noticeBody:  { padding: "12px 14px", flex: 1, minWidth: 0 },
  noticeTitle: { color: "#E6EDF3", fontSize: 13, fontWeight: 700, margin: 0 },
  noticeFile: {
    color: "#58A6FF", fontSize: 12, fontFamily: "monospace",
    margin: "4px 0 0 0", overflow: "hidden",
    textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  noticeSub:     { color: "#8B949E", fontSize: 11, margin: "2px 0 0 0" },
  noticeActions: { display: "flex", gap: 8, marginTop: 10 },
  primaryBtn: {
    background: "#238636", color: "#fff", border: "1px solid #2ea043",
    borderRadius: 6, padding: "5px 12px", fontSize: 12,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  ghostBtn: {
    background: "transparent", color: "#C9D1D9",
    border: "1px solid #30363D", borderRadius: 6,
    padding: "5px 12px", fontSize: 12,
    cursor: "pointer", fontFamily: "inherit",
  },
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    zIndex: 2000, display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  modal: {
    width: "min(1200px, 94vw)", height: "82vh",
    background: "#0D1117", border: "1px solid #30363D",
    borderRadius: 12, display: "flex", flexDirection: "column",
    overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  },
  modalHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 16, padding: "14px 18px",
    borderBottom: "1px solid #30363D", background: "#161B22",
  },
  modalTitle:   { color: "#E6EDF3", fontSize: 15, fontWeight: 700, margin: 0 },
  modalSub:     { color: "#8B949E", fontSize: 12, margin: "3px 0 0 0" },
  modalActions: { display: "flex", alignItems: "center", gap: 8 },
  legend:       { color: "#8B949E", fontSize: 12, display: "flex", alignItems: "center", marginRight: 6 },
  swatch:       { display: "inline-block", width: 10, height: 10, borderRadius: 2, marginRight: 5 },
  modalBody:    { flex: 1, minHeight: 0 },
  emptyText:    { color: "#8B949E", fontSize: 14, textAlign: "center", marginTop: 60 },
};