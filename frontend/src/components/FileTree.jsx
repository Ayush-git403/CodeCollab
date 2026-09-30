import { useState, useRef, useEffect } from "react";

export default function FileTree({
  files, activeFile, onSelect,
  onCreateFile, onDeleteFile, onRenameFile,
  onCreateFolder, onMoveFile, username,
}) {
  const [creating, setCreating]               = useState(false);
  const [createType, setCreateType]           = useState("file");
  const [newName, setNewName]                 = useState("");
  const [createInFolder, setCreateInFolder]   = useState(null);
  const [renaming, setRenaming]               = useState(null);
  const [renameValue, setRenameValue]         = useState("");
  const [expanded, setExpanded]               = useState({});
  const [dragOver, setDragOver]               = useState(null);
  const [dragging, setDragging]               = useState(null);
  const [hovered, setHovered]                 = useState(null);
  const [lastOpenedFolder, setLastOpenedFolder] = useState(null);

  // ── Listen for empty-state button events ───────────────────────────────────
  useEffect(() => {
    const onCreateFileEvt = () => {
      setCreateInFolder(null);
      setCreateType("file");
      setNewName("");
      setCreating(true);
    };
    const onCreateFolderEvt = () => {
      setCreateInFolder(null);
      setCreateType("folder");
      setNewName("");
      setCreating(true);
    };
    window.addEventListener("triggerCreateFile",   onCreateFileEvt);
    window.addEventListener("triggerCreateFolder", onCreateFolderEvt);
    return () => {
      window.removeEventListener("triggerCreateFile",   onCreateFileEvt);
      window.removeEventListener("triggerCreateFolder", onCreateFolderEvt);
    };
  }, []);

  // ── Build tree ──────────────────────────────────────────────────────────────
  const folders   = {};
  const rootFiles = [];

  files.forEach((f) => {
    if (f.type === "folder") folders[f.name] = { ...f, children: [] };
  });

  files.forEach((f) => {
    if (f.type === "folder") return;
    const parts = f.name.split("/");
    if (parts.length > 1) {
      const fn = parts[0];
      if (!folders[fn]) folders[fn] = { name: fn, type: "folder", children: [] };
      folders[fn].children.push({ ...f, displayName: parts.slice(1).join("/") });
    } else {
      rootFiles.push(f);
    }
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getIcon = (filename) => {
    const ext  = filename.split(".").pop().toLowerCase();
    const name = filename.toLowerCase();

    const byName = {
      "package.json":       { color: "#8bc34a", label: "PKG", bg: "#1a2600" },
      "package-lock.json":  { color: "#8bc34a", label: "PKG", bg: "#1a2600" },
      "tsconfig.json":      { color: "#3178c6", label: "TSC", bg: "#001a33" },
      "vite.config.js":     { color: "#646CFF", label: "VIT", bg: "#10102d" },
      "vite.config.ts":     { color: "#646CFF", label: "VIT", bg: "#10102d" },
      ".gitignore":         { color: "#f14e32", label: "GIT", bg: "#2d0a00" },
      ".env":               { color: "#ecd53f", label: "ENV", bg: "#2d2600" },
      "dockerfile":         { color: "#2496ED", label: "DCK", bg: "#001d2d" },
      "readme.md":          { color: "#4285f4", label: "REA", bg: "#001433" },
    };

    const byExt = {
      js:     { color: "#f1e05a", label: "JS",  bg: "#2d2800" },
      jsx:    { color: "#61dafb", label: "JSX", bg: "#002633" },
      ts:     { color: "#3178c6", label: "TS",  bg: "#001a33" },
      tsx:    { color: "#61dafb", label: "TSX", bg: "#002633" },
      py:     { color: "#3572A5", label: "PY",  bg: "#001220" },
      html:   { color: "#e44d26", label: "HTM", bg: "#2d0a00" },
      css:    { color: "#563d7c", label: "CSS", bg: "#1a0d2d" },
      scss:   { color: "#c6538c", label: "SCO", bg: "#2d0019" },
      cpp:    { color: "#f34b7d", label: "C++", bg: "#2d0018" },
      c:      { color: "#888888", label: "C",   bg: "#1a1a1a" },
      h:      { color: "#888888", label: "H",   bg: "#1a1a1a" },
      java:   { color: "#b07219", label: "JAV", bg: "#2d1c00" },
      go:     { color: "#00ADD8", label: "GO",  bg: "#002933" },
      rs:     { color: "#dea584", label: "RS",  bg: "#2d1800" },
      vue:    { color: "#41b883", label: "VUE", bg: "#0d2619" },
      json:   { color: "#8bc34a", label: "JSN", bg: "#1a2600" },
      md:     { color: "#4285f4", label: "MD",  bg: "#001433" },
      yml:    { color: "#cb171e", label: "YML", bg: "#2d0003" },
      yaml:   { color: "#cb171e", label: "YML", bg: "#2d0003" },
      xml:    { color: "#f60",    label: "XML", bg: "#2d1400" },
      sql:    { color: "#e38c00", label: "SQL", bg: "#2d1c00" },
      sh:     { color: "#89e051", label: "SH",  bg: "#162600" },
      env:    { color: "#ecd53f", label: "ENV", bg: "#2d2600" },
      txt:    { color: "#8B949E", label: "TXT", bg: "#1a1f26" },
      csv:    { color: "#8bc34a", label: "CSV", bg: "#1a2600" },
      svg:    { color: "#FFB13B", label: "SVG", bg: "#2d2000" },
      png:    { color: "#a074c4", label: "PNG", bg: "#1e0d2d" },
      jpg:    { color: "#a074c4", label: "JPG", bg: "#1e0d2d" },
    };

    const icon = byName[name] || byExt[ext] || {
      color: "#8B949E",
      label: ext ? ext.substring(0, 3).toUpperCase() : "DOC",
      bg: "#1a1f26",
    };

    const fs = icon.label.length > 2 ? 5 : 6;

    return (
      <svg width="16" height="16" viewBox="0 0 16 16"
        style={{ flexShrink: 0, display: "block" }}>
        <path
          d="M9.5 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9.5 1z"
          fill={icon.bg} stroke={icon.color} strokeWidth="0.75"
        />
        <path d="M9.5 1L13 5.5H9.5V1z" fill={icon.color} opacity="0.7" />
        <text x="6.5" y="12.2" textAnchor="middle"
          fontSize={fs}
          fontFamily="'Segoe UI',Arial,sans-serif"
          fontWeight="800" fill={icon.color} letterSpacing="-0.3">
          {icon.label}
        </text>
      </svg>
    );
  };

  const getFolderIcon = (open) => open ? (
    <svg width="16" height="16" viewBox="0 0 16 16"
      style={{ flexShrink: 0, display: "block" }}>
      <path d="M1.5 4A1.5 1.5 0 0 1 3 2.5h3.172a1.5 1.5 0 0 1 1.06.44l.718.717A.5.5 0 0 0 8.306 4H13a1 1 0 0 1 1 1v.5H1V5a.5.5 0 0 1 .5-.5V4z"
        fill="#DCAA6A"/>
      <path d="M1 6.5h14l-1.25 6H2.25L1 6.5z" fill="#DCAA6A"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16"
      style={{ flexShrink: 0, display: "block" }}>
      <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v7A1.5 1.5 0 0 0 1.5 13h13a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14.5 6H8l-1.5-1.5a1.5 1.5 0 0 0-1.06-.44H1.5z"
        fill="#C09553"/>
      <path d="M0 6h16v5.5A1.5 1.5 0 0 1 14.5 13H1.5A1.5 1.5 0 0 1 0 11.5V6z"
        fill="#DCAA6A"/>
    </svg>
  );

  // ── Create / Rename ─────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!newName.trim()) return;
    if (createType === "folder") {
      onCreateFolder(newName.trim());
    } else {
      const full = createInFolder
        ? `${createInFolder}/${newName.trim()}`
        : newName.trim();
      onCreateFile(full);
    }
    setNewName(""); setCreating(false); setCreateInFolder(null);
  };

  const handleCreateFileBtn = () => {
    const open = lastOpenedFolder && expanded[lastOpenedFolder]
      ? lastOpenedFolder : null;
    setCreateInFolder(open);
    setCreateType("file");
    setNewName("");
    setCreating(true);
    if (open) setExpanded((p) => ({ ...p, [open]: true }));
  };

  const handleRenameSubmit = (oldName) => {
    if (!renameValue.trim() || renameValue === oldName) {
      setRenaming(null); return;
    }
    onRenameFile(oldName, renameValue.trim());
    setRenaming(null); setRenameValue("");
  };

  const toggleFolder = (name) => {
    const willOpen = !expanded[name];
    setExpanded((p) => ({ ...p, [name]: willOpen }));
    if (willOpen) setLastOpenedFolder(name);
    else if (lastOpenedFolder === name) setLastOpenedFolder(null);
  };

  // ── Drag ────────────────────────────────────────────────────────────────────
  const onDragStart = (e, filename) => {
    setDragging(filename);
    e.dataTransfer.setData("filename", filename);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };

  const onFolderDragOver = (e, name) => {
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOver(name);
  };
  const onFolderDrop = (e, name) => {
    e.preventDefault(); e.stopPropagation();
    const filename = e.dataTransfer.getData("filename");
    if (!filename) return;
    const cur = filename.includes("/") ? filename.split("/")[0] : null;
    if (cur !== name) onMoveFile(filename, name);
    setDragOver(null); setDragging(null);
    setExpanded((p) => ({ ...p, [name]: true }));
  };
  const onRootDrop = (e) => {
    e.preventDefault();
    const filename = e.dataTransfer.getData("filename");
    if (filename && filename.includes("/")) onMoveFile(filename, null);
    setDragOver(null); setDragging(null);
  };

  // ── Render file row ─────────────────────────────────────────────────────────
  const renderFile = (file, indent = 0) => {
    const dn      = file.displayName || file.name;
    const isActive = activeFile === file.name;
    const isHov   = hovered === file.name;
    const isDrag  = dragging === file.name;

    return (
      <div key={file.name} style={{ position: "relative" }}>
        {renaming === file.name ? (
          <div style={{
            display: "flex", alignItems: "center",
            gap: 4, padding: `2px 8px 2px ${8 + indent * 16}px`,
          }}>
            <input autoFocus style={S.renameInput}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")  handleRenameSubmit(file.name);
                if (e.key === "Escape") { setRenaming(null); setRenameValue(""); }
              }}
              onBlur={() => handleRenameSubmit(file.name)}
            />
          </div>
        ) : (
          <div
            draggable
            onDragStart={(e) => onDragStart(e, file.name)}
            onDragEnd={onDragEnd}
            onMouseEnter={() => setHovered(file.name)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(file)}
            style={{
              ...S.fileRow,
              paddingLeft: `${8 + indent * 16}px`,
              background: isActive ? "#2D3748" : isHov ? "#1F2937" : "transparent",
              opacity: isDrag ? 0.3 : 1,
            }}
          >
            {isActive && <div style={S.activeBar} />}
            {getIcon(dn)}
            <span style={S.fileName}>{dn}</span>
            {isHov && (
              <div style={S.actions}>
                <button style={S.actionBtn} title="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenaming(file.name);
                    setRenameValue(dn);
                  }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="#8B949E">
                    <path d="M13.23 1a2.65 2.65 0 0 0-1.88.78L3 10.12V13h2.88l8.35-8.35a2.65 2.65 0 0 0 0-3.75A2.65 2.65 0 0 0 13.23 1zm0 1a1.65 1.65 0 0 1 1.17.48 1.65 1.65 0 0 1 0 2.34L13 6.2 9.8 3l1.38-1.38A1.65 1.65 0 0 1 13.23 2zM9.1 3.7 12.3 6.9 5 14.2H2V11.5L9.1 3.7z"/>
                  </svg>
                </button>
                <button style={{ ...S.actionBtn, color: "#F78166" }} title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${dn}"?`)) onDeleteFile(file.name);
                  }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="#F78166">
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995H11zm1.958 1l-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Render folder ───────────────────────────────────────────────────────────
  const renderFolder = (folder, indent = 0) => {
    const isOpen = !!expanded[folder.name];
    const isOver = dragOver === folder.name;
    const isHov  = hovered === `__f__${folder.name}`;

    return (
      <div key={folder.name}>
        <div
          onDragOver={(e) => onFolderDragOver(e, folder.name)}
          onDrop={(e) => onFolderDrop(e, folder.name)}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null);
          }}
        >
          <div
            onMouseEnter={() => setHovered(`__f__${folder.name}`)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => toggleFolder(folder.name)}
            style={{
              ...S.folderRow,
              paddingLeft: `${8 + indent * 16}px`,
              background: isOver
                ? "rgba(88,166,255,0.10)"
                : isHov ? "#1F2937" : "transparent",
              outline: isOver ? "1px dashed #58A6FF" : "none",
              outlineOffset: "-1px",
            }}
          >
            <span style={S.arrow}>{isOpen ? "▾" : "▸"}</span>
            {getFolderIcon(isOpen)}
            <span style={S.folderName}>{folder.name}</span>
            {isOver && (
              <span style={{ color: "#58A6FF", fontSize: 10, flexShrink: 0 }}>
                drop here
              </span>
            )}
            {isHov && !isOver && (
              <div style={S.actions}>
                <button style={S.actionBtn} title="New file inside"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreateInFolder(folder.name);
                    setCreateType("file");
                    setNewName("");
                    setCreating(true);
                    setExpanded((p) => ({ ...p, [folder.name]: true }));
                    setLastOpenedFolder(folder.name);
                  }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="#8B949E">
                    <path d="M9 1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6L9 1zm0 1.5L12.5 6H9V2.5zM8 12H6v-1h2V9h1v2h2v1h-2v2H8v-2z"/>
                  </svg>
                </button>
                <button style={{ ...S.actionBtn, color: "#F78166" }} title="Delete folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete folder "${folder.name}" and all files inside?`)) {
                      folder.children?.forEach((f) => onDeleteFile(f.name));
                      onDeleteFile(folder.name);
                    }
                  }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="#F78166">
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995H11zm1.958 1l-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {isOpen && (
            <div>
              {(!folder.children || folder.children.length === 0) && !creating && (
                <div style={{
                  color: "#4A5568", fontSize: 11, fontStyle: "italic",
                  padding: `3px 0 3px ${24 + indent * 16}px`,
                }}>
                  empty — drag files here
                </div>
              )}
              {folder.children?.map((f) => renderFile(f, indent + 1))}

              {creating && createInFolder === folder.name && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: `3px 8px 3px ${24 + indent * 16}px`,
                  background: "#0D1117",
                  borderLeft: "2px solid #58A6FF",
                  marginLeft: `${8 + indent * 16}px`,
                }}>
                  <span style={{
                    color: "#58A6FF", fontSize: 10,
                    flexShrink: 0, fontFamily: "monospace",
                  }}>
                    {folder.name}/
                  </span>
                  <input autoFocus style={S.newInput}
                    placeholder="filename.js"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")  handleCreate();
                      if (e.key === "Escape") {
                        setCreating(false); setNewName(""); setCreateInFolder(null);
                      }
                    }}
                  />
                  <button style={S.okBtn} onClick={handleCreate}>✓</button>
                  <button style={S.cancelBtn}
                    onClick={() => { setCreating(false); setNewName(""); setCreateInFolder(null); }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div style={S.container}>

      {/* Header */}
      <div style={S.header}>
        <span style={S.title}>EXPLORER</span>
        <div style={S.headerBtns}>
          <button style={S.headerBtn} title="New File" onClick={handleCreateFileBtn}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9 1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6L9 1zm0 1.5L12.5 6H9V2.5zM8 12H6v-1h2V9h1v2h2v1h-2v2H8v-2z"/>
            </svg>
          </button>
          <button style={S.headerBtn} title="New Folder"
            onClick={() => {
              setCreating(true); setCreateType("folder");
              setCreateInFolder(null); setNewName("");
            }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M.5 3l.04.87A2 2 0 0 0 0 5v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-1.49-1.929L9.5 2h-4L4 3H.5zm11 8h2v1h-2v2h-1v-2h-2v-1h2V9h1v2zM2 5h12v7H2V5zm7-2 .5.5H8.5L8 3h1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tree */}
      <div
        style={{ flex: 1 }}
        onDragOver={(e) => { if (!dragOver) e.preventDefault(); }}
        onDrop={onRootDrop}
      >
        {Object.values(folders).map((f) => renderFolder(f))}
        {rootFiles.map((f) => renderFile(f))}

        {/* Root level create input */}
        {creating && !createInFolder && (
          <div style={{ ...S.newRow, paddingLeft: 12 }}>
            {createType === "folder"
              ? getFolderIcon(false)
              : getIcon(newName || "file.txt")
            }
            <input autoFocus style={S.newInput}
              placeholder={createType === "folder" ? "folder-name" : "filename.js"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")  handleCreate();
                if (e.key === "Escape") { setCreating(false); setNewName(""); }
              }}
            />
            <button style={S.okBtn} onClick={handleCreate}>✓</button>
            <button style={S.cancelBtn}
              onClick={() => { setCreating(false); setNewName(""); }}>
              ✕
            </button>
          </div>
        )}

        {Object.keys(folders).length > 0 && (
          <div style={S.hint}>drag files onto folders to move</div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  container: {
    display: "flex", flexDirection: "column",
    flex: 1, userSelect: "none",
    fontFamily: "-apple-system,'Segoe UI',sans-serif",
    overflow: "hidden",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "6px 8px",
    borderBottom: "1px solid #30363D", flexShrink: 0,
  },
  title: {
    color: "#BBBBBB", fontSize: 10,
    fontWeight: 600, letterSpacing: "1.2px",
  },
  headerBtns: { display: "flex", gap: 2 },
  headerBtn: {
    background: "transparent", border: "none",
    color: "#8B949E", cursor: "pointer",
    padding: "3px 5px", borderRadius: 3,
    display: "flex", alignItems: "center",
  },
  folderRow: {
    display: "flex", alignItems: "center",
    gap: 5, height: 28, cursor: "pointer",
    position: "relative", borderRadius: 3,
    margin: "1px 4px", transition: "background 0.08s",
  },
  arrow: {
    color: "#8B949E", fontSize: 9,
    width: 10, flexShrink: 0, textAlign: "center",
  },
  folderName: {
    color: "#C9D1D9", fontSize: 13,
    fontWeight: 500, flex: 1,
    whiteSpace: "nowrap", overflow: "hidden",
    textOverflow: "ellipsis",
  },
  fileRow: {
    display: "flex", alignItems: "center",
    gap: 5, height: 26, cursor: "pointer",
    position: "relative", borderRadius: 3,
    margin: "1px 4px", transition: "background 0.08s",
  },
  activeBar: {
    position: "absolute", left: -4,
    top: 2, bottom: 2, width: 2,
    background: "#58A6FF", borderRadius: 2,
  },
  fileName: {
    color: "#C9D1D9", fontSize: 13, flex: 1,
    whiteSpace: "nowrap", overflow: "hidden",
    textOverflow: "ellipsis",
  },
  actions: {
    display: "flex", gap: 1,
    alignItems: "center", flexShrink: 0,
  },
  actionBtn: {
    background: "transparent", border: "none",
    color: "#8B949E", cursor: "pointer",
    padding: "2px 3px", borderRadius: 3,
    display: "flex", alignItems: "center",
  },
  renameInput: {
    flex: 1, background: "#0D1117",
    border: "1px solid #58A6FF", borderRadius: 3,
    color: "#C9D1D9", padding: "2px 6px",
    fontSize: 12, outline: "none",
    fontFamily: "monospace", width: "100%",
  },
  newRow: {
    display: "flex", alignItems: "center",
    gap: 4, padding: "3px 8px",
    background: "#161B22",
  },
  newInput: {
    flex: 1, background: "#0D1117",
    border: "1px solid #58A6FF", borderRadius: 3,
    color: "#C9D1D9", padding: "2px 6px",
    fontSize: 12, outline: "none", fontFamily: "monospace",
  },
  okBtn: {
    background: "#238636", color: "#fff",
    border: "none", borderRadius: 3,
    padding: "2px 7px", cursor: "pointer", fontSize: 11,
  },
  cancelBtn: {
    background: "transparent", color: "#8B949E",
    border: "1px solid #30363D", borderRadius: 3,
    padding: "2px 6px", cursor: "pointer", fontSize: 11,
  },
  hint: {
    color: "#4A5568", fontSize: 10,
    padding: "6px 12px", fontStyle: "italic", textAlign: "center",
  },
};