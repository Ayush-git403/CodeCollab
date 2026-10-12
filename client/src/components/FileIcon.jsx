// client/src/components/FileIcon.jsx
// Colorful, self-contained file & folder icons (no extra packages).
//
// Usage:
//   <FileIcon name="index.html" />
//   <FileIcon name="React" />                 // matches template files without extension
//   <FileIcon isFolder open={isExpanded} />
//   <FileIcon name="app.js" size={20} />

const BASE = {
  html: "#E8590C",
  css: "#2F7BEA",
  js: "#F7DF1E",
  ts: "#3178C6",
  json: "#F5A524",
  md: "#64748B",
  py: "#3776AB",
  java: "#E76F00",
  c: "#5C6BC0",
  cpp: "#4A5BB8",
  go: "#00ADD8",
  react: "#17212B",
  node: "#3C873A",
};

// Template files in your explorer have no extension ("React", "Node")
const BY_NAME = {
  react: "react",
  node: "node",
  "package.json": "node",
  "readme.md": "md",
};

const BY_EXT = {
  html: "html",
  htm: "html",
  css: "css",
  scss: "css",
  js: "js",
  mjs: "js",
  cjs: "js",
  jsx: "react",
  tsx: "react",
  ts: "ts",
  json: "json",
  md: "md",
  py: "py",
  java: "java",
  c: "c",
  cpp: "cpp",
  cc: "cpp",
  go: "go",
};

function getKind(name = "") {
  const lower = name.toLowerCase().trim();
  if (BY_NAME[lower]) return BY_NAME[lower];
  const ext = lower.includes(".") ? lower.split(".").pop() : "";
  return BY_EXT[ext] || "default";
}

// Rounded colored tile that every file type sits on
const Tile = ({ color }) => (
  <>
    <rect x="2" y="2" width="20" height="20" rx="5.5" fill={color} />
    <rect
      x="2.5"
      y="2.5"
      width="19"
      height="19"
      rx="5"
      fill="none"
      stroke="#fff"
      strokeOpacity="0.18"
    />
  </>
);

const Label = ({ children, size = 9.5, fill = "#fff", dy = 3.4 }) => (
  <text
    x="12"
    y={12 + dy}
    textAnchor="middle"
    fontSize={size}
    fontWeight="800"
    fontFamily="Inter, 'Segoe UI', system-ui, sans-serif"
    fill={fill}
  >
    {children}
  </text>
);

const stroke = {
  fill: "none",
  stroke: "#fff",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Glyph({ kind }) {
  switch (kind) {
    case "html":
      return (
        <>
          <Tile color={BASE.html} />
          <path d="M9.5 8.5 6 12l3.5 3.5M14.5 8.5 18 12l-3.5 3.5M13 7.5l-2 9" {...stroke} />
        </>
      );
    case "css":
      return (
        <>
          <Tile color={BASE.css} />
          <path d="M9.6 6.5 8.6 17.5M15.6 6.5l-1 11M6.5 10h11.5M6 14h11.5" {...stroke} strokeWidth={1.8} />
        </>
      );
    case "js":
      return (
        <>
          <Tile color={BASE.js} />
          <Label fill="#1A1A1A" size={10.5}>JS</Label>
        </>
      );
    case "ts":
      return (
        <>
          <Tile color={BASE.ts} />
          <Label size={10.5}>TS</Label>
        </>
      );
    case "react":
      return (
        <>
          <Tile color={BASE.react} />
          <g fill="none" stroke="#61DAFB" strokeWidth="1.25">
            <ellipse cx="12" cy="12" rx="7.6" ry="3" />
            <ellipse cx="12" cy="12" rx="7.6" ry="3" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="7.6" ry="3" transform="rotate(120 12 12)" />
          </g>
          <circle cx="12" cy="12" r="1.5" fill="#61DAFB" />
        </>
      );
    case "node":
      return (
        <>
          <polygon
            points="12,2 20.5,7 20.5,17 12,22 3.5,17 3.5,7"
            fill={BASE.node}
          />
          <polygon
            points="12,2.6 20,7.3 20,16.7 12,21.4 4,16.7 4,7.3"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.2"
          />
          <Label size={10} dy={3.5}>N</Label>
        </>
      );
    case "json":
      return (
        <>
          <Tile color={BASE.json} />
          <Label fill="#1A1A1A" size={11}>{"{}"}</Label>
        </>
      );
    case "md":
      return (
        <>
          <Tile color={BASE.md} />
          <Label size={8.5}>MD</Label>
        </>
      );
    case "py":
      return (
        <>
          <Tile color={BASE.py} />
          <Label fill="#FFD43B" size={10.5}>Py</Label>
        </>
      );
    case "java":
      return (
        <>
          <Tile color={BASE.java} />
          <Label size={10.5}>Jv</Label>
        </>
      );
    case "c":
      return (
        <>
          <Tile color={BASE.c} />
          <Label size={12}>C</Label>
        </>
      );
    case "cpp":
      return (
        <>
          <Tile color={BASE.cpp} />
          <Label size={9.5}>C++</Label>
        </>
      );
    case "go":
      return (
        <>
          <Tile color={BASE.go} />
          <Label size={10.5}>Go</Label>
        </>
      );
    default:
      return (
        <>
          <path
            d="M6.5 2.5h7.5l4.5 4.5v12.5a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2z"
            fill="#3A4452"
          />
          <path d="M14 2.5V7h4.5z" fill="#5B6879" />
          <path d="M7.5 12h9M7.5 15h9M7.5 18h5" stroke="#8B98A9" strokeWidth="1.2" strokeLinecap="round" />
        </>
      );
  }
}

function FolderGlyph({ open }) {
  if (open) {
    return (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3z" fill="#C9962A" />
        <path
          d="M2.5 10.5a1 1 0 0 1 1-.9h17.2a1 1 0 0 1 1 1.2l-1.6 7.3a2 2 0 0 1-2 1.6H5.2a2 2 0 0 1-1.9-1.4z"
          fill="#F2C94C"
        />
      </>
    );
  }
  return (
    <>
      <path
        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        fill="#E3B341"
      />
      <path d="M3 10h18v1H3z" fill="#fff" fillOpacity="0.18" />
    </>
  );
}

export default function FileIcon({ name = "", isFolder = false, open = false, size = 18, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ flexShrink: 0, display: "block", ...style }}
    >
      {isFolder ? <FolderGlyph open={open} /> : <Glyph kind={getKind(name)} />}
    </svg>
  );
}