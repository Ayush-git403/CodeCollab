import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

// ─────────────────────────────────────────────────────────────────────────────
// Terminal2  –  VS Code-style integrated terminal powered by WebContainer's
//              built-in jsh shell.
// ─────────────────────────────────────────────────────────────────────────────
export default function Terminal2({ webcontainer, previewUrl }) {
  const previewUrlRef = useRef(null); // latest dev-server preview URL
  previewUrlRef.current = previewUrl;

  const terminalRef = useRef(null); // DOM node xterm renders into
  const xtermRef = useRef(null); // Terminal instance
  const fitRef = useRef(null); // FitAddon instance
  const shellRef = useRef(null); // jsh process
  const inputRef = useRef(null); // WritableStreamDefaultWriter to shell stdin
  const mountedRef = useRef(false); // guard: terminal DOM created?
  const connectedRef = useRef(false); // guard: shell connected to this wc?

  const [status, setStatus] = useState("idle"); // idle | booting | ready | error

  // ── 1. Create / destroy the xterm DOM element ──────────────────────────────
  useEffect(() => {
    if (!terminalRef.current || mountedRef.current) return;
    mountedRef.current = true;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
      scrollback: 5000,
      allowTransparency: true,
      theme: {
        background: "#1e1e1e", // VS Code dark default
        foreground: "#cccccc",
        cursor: "#aeafad",
        cursorAccent: "#1e1e1e",
        selectionBackground: "rgba(255,255,255,0.2)",
        black: "#1e1e1e",
        red: "#f44747",
        green: "#6a9955",
        yellow: "#d7ba7d",
        blue: "#569cd6",
        magenta: "#c678dd",
        cyan: "#4ec9b0",
        white: "#d4d4d4",
        brightBlack: "#808080",
        brightRed: "#f44747",
        brightGreen: "#b5cea8",
        brightYellow: "#dcdcaa",
        brightBlue: "#9cdcfe",
        brightMagenta: "#c586c0",
        brightCyan: "#4fc1ff",
        brightWhite: "#ffffff",
      },
    });

    const fit = new FitAddon();
    // localhost links only exist inside the container, so open the preview URL
    // WebContainer assigned to the dev server instead
    const links = new WebLinksAddon((_event, uri) => {
      try {
        const u = new URL(uri);
        const isLocal = ["localhost", "127.0.0.1", "0.0.0.0"].includes(
          u.hostname,
        );
        if (isLocal) {
          const base = previewUrlRef.current;
          if (base) {
            window.open(
              new URL(u.pathname + u.search + u.hash, base).toString(),
              "_blank",
            );
          }
          return; // dev server not ready yet: nothing to open
        }
      } catch {}
      window.open(uri, "_blank", "noopener");
    });
    term.loadAddon(fit);
    term.loadAddon(links);
    term.open(terminalRef.current);
    term.focus();

    // Copy / paste, like VS Code's terminal:
    //  - Ctrl+C copies when text is selected, otherwise it still sends ^C
    //  - Ctrl+V or Ctrl+Shift+V pastes from the clipboard
    term.attachCustomKeyEventHandler((e) => {
      if (e.type !== "keydown") return true;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === "c" && term.hasSelection()) {
        navigator.clipboard.writeText(term.getSelection()).catch(() => {});
        return false;
      }

      if (mod && key === "v") {
        e.preventDefault();
        navigator.clipboard
          .readText()
          .then((text) => term.paste(text))
          .catch(() => {});
        return false;
      }

      return true;
    });

    xtermRef.current = term;
    fitRef.current = fit;

    // Initial fit after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          fit.fit();
        } catch {}
      });
    });

    // ResizeObserver keeps cols/rows in sync when the panel is dragged
    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {}
    });
    ro.observe(terminalRef.current);

    return () => {
      ro.disconnect();
      mountedRef.current = false;
      connectedRef.current = false;
      shellRef.current = null;
      inputRef.current = null;
      xtermRef.current = null;
      fitRef.current = null;
      term.dispose();
    };
  }, []);

  // ── 2. Connect xterm ↔ WebContainer jsh whenever wc prop arrives ───────────
  useEffect(() => {
    const term = xtermRef.current;

    // Wait until both the terminal DOM and the WebContainer are ready
    if (!webcontainer || !term) return;

    if (connectedRef.current) return;
    connectedRef.current = true;

    let cancelled = false;
    let shell = null; // local copy so cleanup can always kill it
    let inputWriter = null;
    let dataDisposable = null;
    let resizeDisposable = null; // so the resize listener can be removed

    setStatus("booting");
    term.writeln("\x1b[2m  Waiting for shell…\x1b[0m");

    const connect = async () => {
      try {
        // Spawn WebContainer's built-in jsh shell and pipe xterm I/O into it
        shell = await webcontainer.spawn("jsh", {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });

        if (cancelled) {
          shell.kill();
          return;
        }

        shellRef.current = shell;

        // shell stdout → xterm
        shell.output.pipeTo(
          new WritableStream({
            write(chunk) {
              if (!cancelled) term.write(chunk);
            },
          }),
        );

        // xterm keystrokes → shell stdin
        inputWriter = shell.input.getWriter();
        inputRef.current = inputWriter;

        dataDisposable = term.onData((data) => {
          if (!cancelled) inputWriter.write(data);
        });

        // Sync size once now, then on every resize
        shell.resize({ cols: term.cols, rows: term.rows });
        resizeDisposable = term.onResize(({ cols, rows }) => {
          shell.resize({ cols, rows });
        });

        setStatus("ready");

        // Shell exited (e.g. user typed `exit`)
        shell.exit.then(() => {
          if (!cancelled) {
            connectedRef.current = false;
            setStatus("idle");
            term.writeln(
              "\r\n\x1b[2m  Shell exited. Reconnect by closing and reopening the terminal.\x1b[0m",
            );
          }
        });
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          term.writeln(`\r\n\x1b[31m  Shell error: ${err.message}\x1b[0m`);
          connectedRef.current = false;
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      dataDisposable?.dispose();
      resizeDisposable?.dispose();
      try {
        shell?.kill();
      } catch {}
      try {
        inputWriter?.releaseLock();
      } catch {}
      shellRef.current = null;
      inputRef.current = null;
      connectedRef.current = false;
    };
  }, [webcontainer]);

  // ── Status indicator colour ────────────────────────────────────────────────
  const dotColor =
    status === "ready"
      ? "#3fb950"
      : status === "booting"
        ? "#e3b341"
        : status === "error"
          ? "#f78166"
          : "#6e7681";

  return (
    <div style={styles.wrapper}>
      {/* ── VS Code-style terminal tab bar ── */}
      <div style={styles.tabBar}>
        <div style={styles.tabLeft}>
          <div style={styles.activeTab}>
            <div style={{ ...styles.dot, background: dotColor }} />
            <span style={styles.tabLabel}>bash</span>
          </div>
        </div>

        <div style={styles.tabRight}>
          <span style={styles.hint}>
            {status === "booting" && "Starting…"}
            {status === "ready" && ""}
            {status === "error" && "Shell error — check console"}
            {status === "idle" && "Not connected"}
          </span>

          {/* "+" new terminal button (not wired up yet) */}
          <button
            style={styles.iconBtn}
            title="New terminal"
            onClick={() => {
              // Allow parent to wire this up via a prop if needed
            }}
          >
            ＋
          </button>

          {/* Maximise / minimise glyph (cosmetic only) */}
          <button style={styles.iconBtn} title="Maximise panel">
            ⬡
          </button>
        </div>
      </div>

      {/* ── xterm canvas ── */}
      <div ref={terminalRef} style={styles.xterm} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — matches VS Code's integrated terminal panel
// ─────────────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left", // stops global text-align: center from centering output
    background: "#1e1e1e",
    height: "100%",
    minHeight: "0",
    overflow: "hidden",
    borderTop: "1px solid #252526",
  },

  tabBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#252526",
    height: "35px",
    flexShrink: 0,
    paddingLeft: "4px",
    paddingRight: "6px",
    borderBottom: "1px solid #1e1e1e",
  },

  tabLeft: {
    display: "flex",
    alignItems: "center",
    height: "100%",
  },

  activeTab: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    height: "100%",
    padding: "0 12px",
    borderTop: "1px solid #0078d4", // VS Code blue accent
    background: "#1e1e1e",
    color: "#cccccc",
    fontSize: "12px",
    fontFamily: "var(--vscode-font-family, sans-serif)",
    userSelect: "none",
  },

  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  tabLabel: {
    fontSize: "12px",
    color: "#cccccc",
    fontFamily: "monospace",
  },

  tabRight: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },

  hint: {
    color: "#6e7681",
    fontSize: "11px",
    fontFamily: "monospace",
    marginRight: "6px",
  },

  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#cccccc",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: "4px",
    lineHeight: 1,
    opacity: 0.7,
  },

  // The xterm.js render target — flex fills the remaining space
  xterm: {
    flex: 1,
    minHeight: "0",
    padding: "4px 8px 4px 4px",
    overflow: "hidden",
  },
};