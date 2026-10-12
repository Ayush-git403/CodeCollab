import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import axios from "axios";
import { socket } from "../socket";
import Terminal from "../components/Terminal";
import ChatBox from "../components/ChatBox";
import FileTree from "../components/FileTree";
import Toast from "../components/Toast";
import Terminal2 from "../components/Terminal2";
import useWebContainer from "../hooks/useWebContainer";
import useResize from "../hooks/useResize";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
];

function buildPreviewHtml(htmlContent, fileCache) {
  let html = htmlContent;
  html = html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*\/?>/gi,
    (match, href) => {
      const filename = href.split("/").pop();
      const cssContent = fileCache[filename];
      return cssContent ? `<style>\n${cssContent}\n</style>` : match;
    },
  );
  html = html.replace(
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*\/?>/gi,
    (match, href) => {
      const filename = href.split("/").pop();
      const cssContent = fileCache[filename];
      return cssContent ? `<style>\n${cssContent}\n</style>` : match;
    },
  );
  html = html.replace(
    /<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi,
    (match, src) => {
      const filename = src.split("/").pop();
      const jsContent = fileCache[filename];
      return jsContent ? `<script>\n${jsContent}\n</script>` : match;
    },
  );
  return html;
}

function ResizeHandle({ onMouseDown, direction = "vertical" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...(direction === "vertical"
          ? { width: "4px", cursor: "col-resize", height: "100%" }
          : { height: "4px", cursor: "row-resize", width: "100%" }),
        background: hovered ? "#58A6FF" : "transparent",
        flexShrink: 0,
        zIndex: 10,
        transition: "background 0.15s",
      }}
    />
  );
}

export default function Room() {
  const { roomId } = useParams();
  const username = localStorage.getItem("username") || "Anonymous";
  const userId = localStorage.getItem("userId") || "user1";
  const userColor = useRef(
    COLORS[Math.floor(Math.random() * COLORS.length)],
  ).current;

  const [room, setRoom] = useState(null);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [preview, setPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [terminalOpen, setTerminalOpen] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const activeFileRef = useRef(null);
  const fileContentCache = useRef({});
  const isRemoteUpdate = useRef(false);
  const previewRef = useRef(false);

  const sidebar = useResize(220, 140, 480, "horizontal");
  const rightPanel = useResize(240, 160, 440, "horizontal");
  const termPanel = useResize(240, 100, 500, "vertical");
  const { wc, status: nodeStatus, bootTerminal, teardown } = useWebContainer();

  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);
  
  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  useEffect(() => {
    axios
      .get(`https://codecollab-d0p4.onrender.com/api/room/${roomId}`)
      .then((res) => setRoom(res.data))
      .catch(() => alert("Room not found"));
  }, [roomId]);

  const getDefaultFiles = () => [
    { name: "index.html", language: "html", content: "" },
    { name: "style.css", language: "css", content: "" },
    { name: "script.js", language: "javascript", content: "" },
  ];

  useEffect(() => {
    socket.emit("join_room", { roomId, username, color: userColor });

    socket.on("user_joined", ({ users }) => setUsers(users));

    socket.on("room_files", (serverFiles) => {
      serverFiles.forEach((f) => {
        fileContentCache.current[f.name] = f.content || "";
      });
      setFiles(serverFiles);
      const savedTabs = JSON.parse(
        localStorage.getItem(`tabs_${roomId}`) || "[]",
      );
      const validTabs = savedTabs.filter((savedName) =>
        serverFiles.find((f) => f.name === savedName && f.type !== "folder"),
      );

      if (validTabs.length > 0) {
        const tabFiles = validTabs
          .map((name) => serverFiles.find((f) => f.name === name))
          .filter(Boolean);
        setOpenTabs(tabFiles);

        const savedActive = localStorage.getItem(`active_${roomId}`);
        const activeTab =
          tabFiles.find((f) => f.name === savedActive) || tabFiles[0];
        setActiveFile(activeTab);
        activeFileRef.current = activeTab;
      } else {
        setOpenTabs([]);
        setActiveFile(null);
        activeFileRef.current = null;
      }
    });

    socket.on("room_not_started", () => {
      const defaults = getDefaultFiles();
      defaults.forEach((f) => {
        fileContentCache.current[f.name] = f.content || "";
      });
      setFiles(defaults);
      setOpenTabs(defaults);
      setActiveFile(defaults[0]);
      activeFileRef.current = defaults[0];
      socket.emit("start_project", { roomId, files: defaults });
    });

    socket.on("code_update", ({ filename, content }) => {
      fileContentCache.current[filename] = content;
      if (activeFileRef.current?.name === filename && editorRef.current) {
        const position = editorRef.current.getPosition();
        isRemoteUpdate.current = true;
        editorRef.current.setValue(content);
        if (position) editorRef.current.setPosition(position);
        isRemoteUpdate.current = false;
        if (previewRef.current) {
          const htmlFile = Object.keys(fileContentCache.current).find((n) =>
            n.endsWith(".html"),
          );
          if (htmlFile)
            setPreviewContent(
              buildPreviewHtml(
                fileContentCache.current[htmlFile],
                fileContentCache.current,
              ),
            );
        }
      }
    });

    socket.on("file_content", ({ filename, content }) => {
      fileContentCache.current[filename] = content;
      if (activeFileRef.current?.name === filename && editorRef.current) {
        isRemoteUpdate.current = true;
        editorRef.current.setValue(content);
        isRemoteUpdate.current = false;
      }
    });

    socket.on("file_created", ({ file, message }) => {
      fileContentCache.current[file.name] = "";
      setFiles((prev) =>
        prev.find((f) => f.name === file.name) ? prev : [...prev, file],
      );
      addToast(message);
    });

    socket.on("file_deleted", ({ filename, message }) => {
      delete fileContentCache.current[filename];
      setOpenTabs((prev) => prev.filter((t) => t.name !== filename));
      setFiles((prev) => {
        const remaining = prev.filter((f) => f.name !== filename);
        if (activeFileRef.current?.name === filename) {
          const next = remaining.find((f) => f.type !== "folder");
          if (next) {
            setActiveFile(next);
            activeFileRef.current = next;
            if (editorRef.current && monacoRef.current) {
              const content = fileContentCache.current[next.name] ?? "";
              const newModel = monacoRef.current.editor.createModel(
                content,
                next.language,
              );
              const oldModel = editorRef.current.getModel();
              editorRef.current.setModel(newModel);
              if (oldModel) oldModel.dispose();
            }
          } else {
            setActiveFile(null);
            activeFileRef.current = null;
          }
        }
        return remaining;
      });
      addToast(message);
    });

    socket.on("file_renamed", ({ oldName, newName, language, message }) => {
      fileContentCache.current[newName] =
        fileContentCache.current[oldName] ?? "";
      delete fileContentCache.current[oldName];
      setFiles((prev) =>
        prev.map((f) =>
          f.name === oldName ? { ...f, name: newName, language } : f,
        ),
      );
      setOpenTabs((prev) =>
        prev.map((f) =>
          f.name === oldName ? { ...f, name: newName, language } : f,
        ),
      );
      if (activeFileRef.current?.name === oldName) {
        const updated = { ...activeFileRef.current, name: newName, language };
        setActiveFile(updated);
        activeFileRef.current = updated;
      }
      addToast(message);
    });

    socket.on("folder_created", ({ folder, message }) => {
      setFiles((prev) =>
        prev.find((f) => f.name === folder.name) ? prev : [...prev, folder],
      );
      addToast(message);
    });

    socket.on("file_error", (msg) => alert(msg));

    return () => {
      socket.off("user_joined");
      socket.off("room_files");
      socket.off("room_not_started");
      socket.off("code_update");
      socket.off("file_content");
      socket.off("file_created");
      socket.off("file_deleted");
      socket.off("file_renamed");
      socket.off("folder_created");
      socket.off("file_error");
    };
  }, [roomId, username]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const file = activeFileRef.current;
      if (!editorRef.current || !file) return;
      const content = editorRef.current.getValue();
      fileContentCache.current[file.name] = content;
      try {
        await axios.post("https://codecollab-d0p4.onrender.com/api/room/save", {
          roomId,
          filename: file.name,
          language: file.language,
          content,
          savedBy: username,
        });
        setSaveStatus("autosaved");
        setTimeout(() => setSaveStatus("idle"), 1500);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [roomId, username]);

  const addToast = (msg) =>
    setToasts((p) => [...p, { id: Date.now(), message: msg }]);
  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    if (activeFileRef.current) {
      const content =
        fileContentCache.current[activeFileRef.current.name] || "";
      editor.setValue(content);
    }
    editor.onDidChangeModelContent(() => {
      if (isRemoteUpdate.current) return;
      const file = activeFileRef.current;
      if (!file) return;
      const content = editor.getValue();
      fileContentCache.current[file.name] = content;
      socket.emit("code_change", { roomId, filename: file.name, content });
      if (previewRef.current) {
        const htmlFile = Object.keys(fileContentCache.current).find((n) =>
          n.endsWith(".html"),
        );
        if (htmlFile)
          setPreviewContent(
            buildPreviewHtml(
              fileContentCache.current[htmlFile],
              fileContentCache.current,
            ),
          );
      }
    });
  };

  const handleSelectFile = (file) => {
    if (activeFile?.name === file.name) return;
    if (activeFile && editorRef.current) {
      fileContentCache.current[activeFile.name] = editorRef.current.getValue();
    }
    setActiveFile(file);
    activeFileRef.current = file;
    setPreview(false);
    setPreviewContent("");
    setOutput("");
    setOpenTabs((prev) => {
      const updated = prev.find((t) => t.name === file.name)
        ? prev
        : [...prev, file];
      localStorage.setItem(
        `tabs_${roomId}`,
        JSON.stringify(updated.map((t) => t.name)),
      );
      return updated;
    });
    localStorage.setItem(`active_${roomId}`, file.name);
    if (editorRef.current && monacoRef.current) {
      const content = fileContentCache.current[file.name] ?? "";
      const newModel = monacoRef.current.editor.createModel(
        content,
        file.language,
      );
      const oldModel = editorRef.current.getModel();
      editorRef.current.setModel(newModel);
      if (oldModel) oldModel.dispose();
      socket.emit("get_file_content", { roomId, filename: file.name });
    }
  };

  const closeTab = (e, filename) => {
    e.stopPropagation();
    setOpenTabs((prev) => {
      const remaining = prev.filter((t) => t.name !== filename);
      localStorage.setItem(
        `tabs_${roomId}`,
        JSON.stringify(remaining.map((t) => t.name)),
      );
      if (remaining.length === 0) {
        localStorage.removeItem(`active_${roomId}`);
      }
      if (activeFile?.name === filename) {
        const idx = prev.findIndex((t) => t.name === filename);
        const next = remaining[idx] || remaining[idx - 1] || null;
        if (next) handleSelectFile(next);
        else {
          setActiveFile(null);
          activeFileRef.current = null;
        }
      }
      return remaining;
    });
  };

  const handleCreateFile = (filename) =>
    socket.emit("create_file", { roomId, filename, username });
  const handleDeleteFile = (filename) =>
    socket.emit("delete_file", { roomId, filename, username });
  const handleRenameFile = (oldName, newName) =>
    socket.emit("rename_file", { roomId, oldName, newName, username });
  const handleCreateFolder = (folderName) =>
    socket.emit("create_folder", { roomId, folderName, username });
  const handleMoveFile = (filename, targetFolder) => {
    const newName = targetFolder
      ? `${targetFolder}/${filename.split("/").pop()}`
      : filename.split("/").pop();
    if (newName !== filename) {
      socket.emit("rename_file", {
        roomId,
        oldName: filename,
        newName,
        username,
      });
    }
  };

  const handlePreviewToggle = () => {
    if (!preview) {
      const htmlContent = fileContentCache.current[activeFile?.name] || "";
      setPreviewContent(
        buildPreviewHtml(htmlContent, fileContentCache.current),
      );
    }
    setPreview(!preview);
  };

  const runCode = async () => {
    setRunning(true);
    setOutput("");
    try {
      const code = editorRef.current.getValue();
      const res = await axios.post(
        "https://codecollab-d0p4.onrender.com/api/execute/run",
        {
          code,
          language: activeFile.language,
          roomId,
          userId,
          username,
        },
      );
      setOutput(res.data.output);
    } catch {
      setOutput("Execution error.");
    }
    setRunning(false);
  };

  const saveCode = async () => {
    setSaveStatus("saving");
    const content = editorRef.current.getValue();
    fileContentCache.current[activeFile.name] = content;
    try {
      await axios.post("https://codecollab-d0p4.onrender.com/api/room/save", {
        roomId,
        filename: activeFile.name,
        language: activeFile.language,
        content,
        savedBy: username,
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const downloadCode = () => {
    const blob = new Blob([editorRef.current.getValue()], {
      type: "text/plain",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = activeFile.name;
    a.click();
  };

  const toggleTerminal = async () => {
    if (terminalOpen) {
      setTerminalOpen(false);
      return;
    }
    setTerminalOpen(true);
    await bootTerminal(fileContentCache.current);
  };

  if (!room) return <div style={styles.loading}>Loading room...</div>;

  const isHtml = activeFile?.language === "html";
  const canRun =
    activeFile &&
    !["html", "css", "markdown", "plaintext"].includes(activeFile.language);

  const saveLabel = () => {
    if (saveStatus === "saving") return "Saving...";
    if (saveStatus === "saved") return "✓ Saved";
    if (saveStatus === "autosaved") return "✓ Auto-saved";
    if (saveStatus === "error") return "✗ Error";
    return "💾 Save";
  };

  return (
    <div style={styles.page}>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          onDone={() => removeToast(t.id)}
        />
      ))}

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>⚡</span>
          <span style={styles.appName}>CodeCollab</span>
          <span style={styles.separator}>›</span>
          <span style={styles.roomName}>{room.name}</span>
          <span style={styles.roomBadge}>#{roomId}</span>
        </div>
        <div style={styles.usersRow}>
          {users.map((u, i) => (
            <div key={i} style={styles.userChip}>
              <div
                style={{
                  ...styles.userDot,
                  background: u.color || COLORS[i % COLORS.length],
                }}
              />
              <span>{u.username}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.body}>
        <div
          ref={sidebar.frameRef}
          style={{ ...styles.sidebar, width: "220px" }}
        >
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>EXPLORER</span>
          </div>
          <div style={styles.sidebarProject}>
            <span style={styles.projectIcon}>📁</span>
            <span style={styles.projectName}>{room.name.toUpperCase()}</span>
          </div>
          <FileTree
            files={files}
            activeFile={activeFile?.name}
            onSelect={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
            onCreateFolder={handleCreateFolder}
            onMoveFile={handleMoveFile}
            username={username}
          />
        </div>

        <ResizeHandle onMouseDown={sidebar.startResize} direction="vertical" />

        <div style={styles.editorPanel}>
          {openTabs.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>⚡</div>
              <h2 style={styles.emptyTitle}>CodeCollab Arena</h2>
              <p style={styles.emptyDesc}>
                Open a file from the explorer to start editing
              </p>
              <div style={styles.emptyActions}>
                <button
                  style={styles.emptyBtn}
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("triggerCreateFile"))
                  }
                >
                  📄 New File
                </button>
                <button
                  style={{ ...styles.emptyBtn, background: "#21262D" }}
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("triggerCreateFolder"))
                  }
                >
                  📁 New Folder
                </button>
              </div>
            </div>
          )}

          {openTabs.length > 0 && (
            <div style={styles.tabBar}>
              {openTabs.map((f) => {
                const isActive = activeFile?.name === f.name;
                const name = f.name.includes("/")
                  ? f.name.split("/").pop()
                  : f.name;
                return (
                  <div
                    key={f.name}
                    style={{
                      ...styles.tab,
                      ...(isActive ? styles.tabActive : {}),
                    }}
                    onClick={() => handleSelectFile(f)}
                  >
                    <span style={styles.tabName}>{name}</span>
                    <span
                      style={{
                        ...styles.tabClose,
                        opacity: isActive ? 1 : 0.4,
                      }}
                      onClick={(e) => closeTab(e, f.name)}
                      title="Close tab"
                    >
                      ×
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {openTabs.length > 0 && (
            <div style={styles.toolbar}>
              <div style={styles.breadcrumb}>
                <span style={styles.breadcrumbText}>
                  {room.name} › {activeFile?.name}
                </span>
                <span style={styles.langBadge}>{activeFile?.language}</span>
              </div>
              <div style={styles.toolbarRight}>
                {isHtml && (
                  <button
                    style={styles.previewBtn}
                    onClick={handlePreviewToggle}
                  >
                    {preview ? "📝 Editor" : "👁 Preview"}
                  </button>
                )}
                <button
                  style={styles.iconBtn}
                  onClick={downloadCode}
                  title="Download"
                >
                  ⬇
                </button>
                <button style={styles.saveBtn} onClick={saveCode}>
                  {saveLabel()}
                </button>
                {canRun && (
                  <button
                    style={styles.runBtn}
                    onClick={runCode}
                    disabled={running}
                  >
                    {running ? "⏳ Running..." : "▶ Run"}
                  </button>
                )}
                <button
                  style={{
                    ...styles.runBtn,
                    background: terminalOpen ? "#30363D" : "#6E40C9",
                  }}
                  onClick={toggleTerminal}
                >
                  ⬛ {terminalOpen ? "Close Terminal" : "Terminal"}
                </button>
              </div>
            </div>
          )}

          {openTabs.length > 0 &&
            (preview && isHtml ? (
              <iframe
                style={styles.previewFrame}
                srcDoc={previewContent}
                title="HTML Preview"
                sandbox="allow-scripts"
              />
            ) : (
              <MonacoEditor
                height={
                  terminalOpen ? "calc(100vh - 390px)" : "calc(100vh - 130px)"
                }
                language={activeFile?.language || "plaintext"}
                theme="vs-dark"
                onMount={handleEditorMount}
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  cursorBlinking: "smooth",
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  bracketPairColorization: { enabled: true },
                  formatOnPaste: true,
                  tabSize: 2,
                  fontFamily: "Fira Code, Consolas, monospace",
                }}
              />
            ))}

          {output && <Terminal output={output} matched={null} />}

          {terminalOpen && (
            <>
              <ResizeHandle
                onMouseDown={termPanel.startResize}
                direction="horizontal"
              />
              <div
                ref={termPanel.frameRef}
                style={{
                  height: "240px",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Terminal2 webcontainer={wc} />
              </div>
            </>
          )}
        </div>

        <ResizeHandle
          onMouseDown={rightPanel.startResize}
          direction="vertical"
        />

        <div
          ref={rightPanel.frameRef}
          style={{ ...styles.rightPanel, width: "240px" }}
        >
          <div style={styles.infoCard}>
            <p style={styles.infoLabel}>🏠 Room</p>
            <div style={styles.roomIdRow}>
              <div style={styles.roomIdBox}>
                <span style={styles.roomIdText}>{roomId}</span>
                <button
                  style={styles.copyBtn}
                  onClick={() => navigator.clipboard.writeText(roomId)}
                >
                  Copy
                </button>
              </div>
              <button
                style={{
                  ...styles.termBtn,
                  ...(terminalOpen ? styles.termBtnActive : {}),
                }}
                onClick={toggleTerminal}
                title={terminalOpen ? "Close terminal" : "Open terminal"}
              >
                {">_"}
              </button>
            </div>
            <p style={styles.infoSub}>
              {users.length + 1} user{users.length !== 0 ? "s" : ""} online
            </p>
          </div>
          <ChatBox roomId={roomId} username={username} />
        </div>
      </div>

      <div style={styles.statusBar}>
        <span style={styles.statusItem}>⚡ CodeCollab Arena</span>
        {activeFile && (
          <>
            <span style={styles.statusDivider}>|</span>
            <span style={styles.statusItem}>📄 {activeFile.name}</span>
            <span style={styles.statusDivider}>|</span>
            <span style={styles.statusItem}>{activeFile.language}</span>
          </>
        )}
        {saveStatus === "autosaved" && (
          <>
            <span style={styles.statusDivider}>|</span>
            <span style={{ ...styles.statusItem, color: "#3FB950" }}>
              ✓ Auto-saved
            </span>
          </>
        )}
        <span style={{ marginLeft: "auto", ...styles.statusItem }}>
          {users.length + 1} collaborator{users.length !== 0 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#0D1117",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "#C9D1D9",
    overflow: "hidden",
  },
  loading: {
    background: "#0D1117",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#58A6FF",
    fontSize: "18px",
  },
  header: {
    background: "#161B22",
    borderBottom: "1px solid #30363D",
    padding: "0 16px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "8px" },
  logo: { fontSize: "16px" },
  appName: { color: "#58A6FF", fontWeight: "bold", fontSize: "14px" },
  separator: { color: "#30363D", fontSize: "16px" },
  roomName: { color: "#C9D1D9", fontSize: "13px" },
  roomBadge: {
    color: "#8B949E",
    fontSize: "11px",
    fontFamily: "monospace",
    background: "#21262D",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  usersRow: { display: "flex", gap: "6px" },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "#21262D",
    border: "1px solid #30363D",
    borderRadius: "20px",
    padding: "3px 8px",
    fontSize: "11px",
    color: "#C9D1D9",
  },
  userDot: { width: "7px", height: "7px", borderRadius: "50%" },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: {
    background: "#161B22",
    borderRight: "1px solid #30363D",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflowY: "auto",
    overflowX: "hidden",
  },
  sidebarHeader: {
    padding: "10px 12px 6px",
    borderBottom: "1px solid #30363D",
    flexShrink: 0,
  },
  sidebarTitle: {
    color: "#8B949E",
    fontSize: "10px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  sidebarProject: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    flexShrink: 0,
  },
  projectIcon: { fontSize: "13px" },
  projectName: {
    color: "#C9D1D9",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
  },
  editorPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },
  tabBar: {
    display: "flex",
    background: "#0D1117",
    borderBottom: "1px solid #30363D",
    overflowX: "auto",
    flexShrink: 0,
  },
  tab: {
    padding: "7px 12px",
    fontSize: "12px",
    color: "#8B949E",
    cursor: "pointer",
    borderRight: "1px solid #30363D",
    whiteSpace: "nowrap",
    fontFamily: "monospace",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tabActive: {
    color: "#C9D1D9",
    background: "#1E1E1E",
    borderTop: "2px solid #58A6FF",
  },
  tabName: {
    flexShrink: 0,
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tabClose: {
    color: "#8B949E",
    fontSize: "14px",
    lineHeight: 1,
    borderRadius: "3px",
    padding: "0 2px",
    cursor: "pointer",
  },
  toolbar: {
    background: "#1E1E1E",
    padding: "6px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #30363D",
    flexShrink: 0,
  },
  breadcrumb: { display: "flex", alignItems: "center", gap: "8px" },
  breadcrumbText: { color: "#8B949E", fontSize: "12px" },
  langBadge: {
    background: "#21262D",
    color: "#58A6FF",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
  },
  toolbarRight: { display: "flex", gap: "8px", alignItems: "center" },
  previewBtn: {
    background: "#6E40C9",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "11px",
  },
  iconBtn: {
    background: "#21262D",
    color: "#C9D1D9",
    border: "1px solid #30363D",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "12px",
  },
  saveBtn: {
    background: "#21262D",
    color: "#C9D1D9",
    border: "1px solid #30363D",
    borderRadius: "4px",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "11px",
    minWidth: "80px",
  },
  runBtn: {
    background: "#238636",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "bold",
  },
  previewFrame: { flex: 1, border: "none", background: "#fff", height: "100%" },
  rightPanel: {
    background: "#0D1117",
    borderLeft: "1px solid #30363D",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "10px",
    overflowY: "auto",
    flexShrink: 0,
    boxSizing: "border-box",
  },
  infoCard: {
    background: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "8px",
    padding: "12px",
  },
  infoLabel: {
    color: "#58A6FF",
    fontWeight: "bold",
    fontSize: "12px",
    margin: "0 0 8px 0",
  },
  infoSub: {
    color: "#8B949E",
    fontSize: "11px",
    margin: 0,
    whiteSpace: "pre-line",
    lineHeight: "1.8",
  },
  roomIdRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
  },
  roomIdBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#0D1117",
    border: "1px solid #30363D",
    borderRadius: "6px",
    padding: "6px 10px",
    flex: 1,
    minWidth: 0,
  },
  roomIdText: {
    color: "#3FB950",
    fontFamily: "monospace",
    fontWeight: "bold",
    fontSize: "14px",
    letterSpacing: "2px",
  },
  copyBtn: {
    background: "#21262D",
    color: "#C9D1D9",
    border: "1px solid #30363D",
    borderRadius: "4px",
    padding: "2px 7px",
    cursor: "pointer",
    fontSize: "10px",
  },
  termBtn: {
    background: "#21262D",
    color: "#C9D1D9",
    border: "1px solid #30363D",
    borderRadius: "6px",
    width: "34px",
    height: "34px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "monospace",
    fontWeight: "bold",
    flexShrink: 0,
  },
  termBtnActive: {
    background: "#FFFFFF",
    color: "#0D1117",
    border: "1px solid #FFFFFF",
  },
  statusBar: {
    background: "#1F4E79",
    height: "22px",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    gap: "8px",
    flexShrink: 0,
  },
  statusItem: { color: "#C9D1D9", fontSize: "11px", fontFamily: "monospace" },
  statusDivider: { color: "#4A6FA5", fontSize: "11px" },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "40px",
    background: "#0D1117",
  },
  emptyIcon: { fontSize: "52px", opacity: 0.3 },
  emptyTitle: {
    color: "#8B949E",
    fontSize: "22px",
    fontWeight: "bold",
    margin: 0,
  },
  emptyDesc: { color: "#4A5568", fontSize: "14px", margin: 0 },
  emptyActions: { display: "flex", gap: "12px", marginTop: "8px" },
  emptyBtn: {
    background: "#238636",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
