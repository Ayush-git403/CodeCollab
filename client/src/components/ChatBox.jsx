import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../socket";
import axios from "axios";

function relativeTime(isoString) {
  if (!isoString) return "";
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 10)    return "Just now";
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(isoString).toLocaleDateString();
}

function useRelativeTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  return tick;
}

export default function ChatBox({ roomId, username }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]     = useState(false);
  const messagesRef               = useRef(null);
  const bottomRef                 = useRef(null);
  const oldestTimestamp           = useRef(null); // cursor
  const initialLoadDone           = useRef(false);
  const tick                      = useRelativeTick();

  // ── Initial load — latest 50 messages ──────────────────────────────────────
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    setLoading(true);
    axios.get(`http://localhost:5000/api/chat/${roomId}?limit=50`)
      .then((res) => {
        const { messages: msgs, hasMore: more } = res.data;
        setMessages(msgs.map(normalize));
        setHasMore(more);
        if (msgs.length > 0) {
          oldestTimestamp.current = msgs[0].created_at;
        }
      })
      .catch((err) => console.error("Chat history load failed:", err.message))
      .finally(() => setLoading(false));
  }, [roomId]);

  // ── Scroll to bottom on initial load ───────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [loading]);

  // ── Real-time listener ──────────────────────────────────────────────────────
  useEffect(() => {
    socket.off("chat_message");
    socket.on("chat_message", ({ username, message, createdAt }) => {
      setMessages((prev) => {
        const isDupe = prev.some(
          (m) => m.createdAt === createdAt &&
                 m.username  === username  &&
                 m.message   === message
        );
        if (isDupe) return prev;
        return [...prev, normalize({ username, message, created_at: createdAt })];
      });
      // Scroll to bottom for new messages
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return () => socket.off("chat_message");
  }, [roomId]);

  // ── Load older messages on scroll to top ───────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !oldestTimestamp.current) return;

    setLoadingMore(true);

    // Remember scroll height before prepending
    const container   = messagesRef.current;
    const scrollBefore = container ? container.scrollHeight : 0;

    try {
      const res = await axios.get(
        `http://localhost:5000/api/chat/${roomId}?before=${encodeURIComponent(oldestTimestamp.current)}&limit=50`
      );
      const { messages: older, hasMore: more } = res.data;

      if (older.length > 0) {
        oldestTimestamp.current = older[0].created_at;
        setMessages((prev) => [...older.map(normalize), ...prev]);
        setHasMore(more);

        // Restore scroll position after prepend
        requestAnimationFrame(() => {
          if (container) {
            const scrollAfter = container.scrollHeight;
            container.scrollTop = scrollAfter - scrollBefore;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Load more error:", err.message);
    }

    setLoadingMore(false);
  }, [loadingMore, hasMore, roomId]);

  // ── Scroll listener — trigger loadMore when near top ───────────────────────
  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    const onScroll = () => {
      if (container.scrollTop < 60 && hasMore && !loadingMore) {
        loadMore();
      }
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasMore, loadingMore, loadMore]);

  const send = () => {
    if (!input.trim()) return;
    socket.emit("chat_message", { roomId, username, message: input.trim() });
    setInput("");
  };

  // Normalize DB row or socket message to same shape
  function normalize(m) {
    return {
      username:  m.username,
      message:   m.message,
      createdAt: m.created_at || m.createdAt,
    };
  }

  return (
    <div style={S.container}>

      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.onlineDot} />
          <span style={S.title}>Room Chat</span>
        </div>
        <span style={S.count}>{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={S.messages}>

        {/* Load more indicator at top */}
        {hasMore && (
          <div style={S.loadMoreRow}>
            {loadingMore ? (
              <span style={S.loadingMoreText}>Loading older messages...</span>
            ) : (
              <button style={S.loadMoreBtn} onClick={loadMore}>
                ↑ Load older messages
              </button>
            )}
          </div>
        )}

        {/* No more messages indicator */}
        {!hasMore && messages.length > 0 && (
          <div style={S.noMoreRow}>
            <span style={S.noMoreText}>— beginning of chat —</span>
          </div>
        )}

        {loading && (
          <p style={S.loadingText}>Loading history...</p>
        )}

        {!loading && messages.length === 0 && (
          <div style={S.emptyChat}>
            <span style={S.emptyChatIcon}>💬</span>
            <p style={S.emptyChatText}>No messages yet.</p>
            <p style={S.emptyChatSub}>Be the first to say something!</p>
          </div>
        )}

        {messages.map((m, i) => {
          void tick;
          const isMe     = m.username === username;
          const showName = i === 0 || messages[i - 1].username !== m.username;
          const isLast   = i === messages.length - 1 ||
                           messages[i + 1]?.username !== m.username;
          const time     = relativeTime(m.createdAt);

          return (
            <div
              key={`${m.createdAt}-${i}`}
              style={{ ...S.msgGroup, alignItems: isMe ? "flex-end" : "flex-start" }}
            >
              {showName && (
                <div style={{
                  ...S.msgMeta,
                  flexDirection: isMe ? "row-reverse" : "row",
                }}>
                  <span style={{ ...S.msgName, color: isMe ? "#58A6FF" : "#8B949E" }}>
                    {isMe ? "You" : m.username}
                  </span>
                  <span style={S.msgTime}>{time}</span>
                </div>
              )}
              <div style={{
                ...S.bubble,
                background: isMe ? "#0969DA" : "#21262D",
                color: isMe ? "#fff" : "#C9D1D9",
                borderRadius: isMe
                  ? "14px 14px 4px 14px"
                  : "14px 14px 14px 4px",
              }}>
                {m.message}
              </div>
              {isLast && (
                <span style={S.bubbleTime}>{time}</span>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={S.inputRow}>
        <input
          style={S.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message..."
          maxLength={500}
        />
        <button
          style={{
            ...S.sendBtn,
            opacity: input.trim() ? 1 : 0.5,
            cursor: input.trim() ? "pointer" : "default",
          }}
          onClick={send}
          disabled={!input.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

const S = {
  container: {
    background: "#161B22", border: "1px solid #30363D",
    borderRadius: "10px", display: "flex",
    flexDirection: "column", overflow: "hidden",
    flex: 1, minHeight: 0,
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderBottom: "1px solid #30363D", flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "8px" },
  onlineDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#3FB950", flexShrink: 0 },
  title: { color: "#C9D1D9", fontSize: "12px", fontWeight: "bold" },
  count: { color: "#4A5568", fontSize: "10px" },
  messages: {
    flex: 1, overflowY: "auto",
    padding: "10px 12px 6px",
    display: "flex", flexDirection: "column",
    gap: "4px", minHeight: 0,
  },
  loadMoreRow: { display: "flex", justifyContent: "center", padding: "6px 0 10px" },
  loadMoreBtn: {
    background: "#21262D", color: "#8B949E",
    border: "1px solid #30363D", borderRadius: "20px",
    padding: "5px 14px", fontSize: "11px",
    cursor: "pointer", fontFamily: "inherit",
  },
  loadingMoreText: { color: "#4A5568", fontSize: "11px", fontStyle: "italic" },
  noMoreRow: { display: "flex", justifyContent: "center", padding: "4px 0 10px" },
  noMoreText: { color: "#4A5568", fontSize: "10px", fontStyle: "italic" },
  loadingText: {
    color: "#4A5568", fontSize: "12px",
    textAlign: "center", margin: "auto",
    fontStyle: "italic",
  },
  emptyChat: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    flex: 1, gap: "6px", padding: "20px 0",
  },
  emptyChatIcon: { fontSize: "28px", opacity: 0.4 },
  emptyChatText: { color: "#8B949E", fontSize: "13px", margin: 0, fontWeight: "500" },
  emptyChatSub:  { color: "#4A5568", fontSize: "11px", margin: 0 },
  msgGroup: { display: "flex", flexDirection: "column", gap: "2px", marginBottom: "4px" },
  msgMeta:  { display: "flex", alignItems: "center", gap: "6px", paddingLeft: "4px", paddingRight: "4px" },
  msgName:  { fontSize: "11px", fontWeight: "600" },
  msgTime:  { color: "#4A5568", fontSize: "10px" },
  bubble: {
    maxWidth: "85%", padding: "7px 11px",
    fontSize: "13px", lineHeight: "1.5",
    wordBreak: "break-word",
  },
  bubbleTime: { color: "#4A5568", fontSize: "10px", paddingLeft: "4px", paddingRight: "4px" },
  inputRow: {
    display: "flex", gap: "8px", padding: "10px 12px",
    borderTop: "1px solid #30363D", flexShrink: 0,
  },
  input: {
    flex: 1, background: "#0D1117",
    border: "1px solid #30363D", borderRadius: "20px",
    color: "#C9D1D9", padding: "8px 14px",
    fontSize: "13px", outline: "none", fontFamily: "inherit",
  },
  sendBtn: {
    background: "#0969DA", color: "#fff",
    border: "none", borderRadius: "50%",
    width: "34px", height: "34px",
    display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer",
    flexShrink: 0,
  },
};