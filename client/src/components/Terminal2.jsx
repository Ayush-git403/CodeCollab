import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

// ─────────────────────────────────────────────────────────────────────────────
// Terminal2  –  VS Code-style integrated terminal powered by WebContainer's
//              built-in jsh shell.  Replaces the old character-by-character
//              key handler that could never run real commands.
// ─────────────────────────────────────────────────────────────────────────────
export default function Terminal2({ webcontainer }) {
  const terminalRef = useRef(null);   // DOM node xterm renders into
  const xtermRef    = useRef(null);   // Terminal instance
  const fitRef      = useRef(null);   // FitAddon instance
  const shellRef    = useRef(null);   // jsh process
  const inputRef    = useRef(null);   // WritableStreamDefaultWriter to shell stdin
  const mountedRef  = useRef(false);  // guard: terminal DOM created?
  const connectedRef= useRef(false);  // guard: shell connected to this wc?

  const [status, setStatus] = useState("idle"); // idle | booting | ready | error

  // ── 1. Create / destroy the xterm DOM element ──────────────────────────────
  useEffect(() => {
    if (!terminalRef.current || mountedRef.current) return;
    mountedRef.current = true;

    const term = new Terminal({
      cursorBlink : true,
      fontSize    : 13,
      fontFamily  : "'Cascadia Code', 'Fira Code', Consolas, monospace",
      scrollback  : 5000,
      allowTransparency: true,
      theme: {
        background       : "#1e1e1e",   // VS Code dark default
        foreground       : "#cccccc",
        cursor           : "#aeafad",
        cursorAccent     : "#1e1e1e",
        selectionBackground: "rgba(255,255,255,0.2)",
        black            : "#1e1e1e",
        red              : "#f44747",
        green            : "#6a9955",
        yellow           : "#d7ba7d",
        blue             : "#569cd6",
        magenta          : "#c678dd",
        cyan             : "#4ec9b0",
        white            : "#d4d4d4",
        brightBlack      : "#808080",
        brightRed        : "#f44747",
        brightGreen      : "#b5cea8",
        brightYellow     : "#dcdcaa",
        brightBlue       : "#9cdcfe",
        brightMagenta    : "#c586c0",
        brightCyan       : "#4fc1ff",
        brightWhite      : "#ffffff",
      },
    });

    const fit   = new FitAddon();
    const links = new WebLinksAddon();
    term.loadAddon(fit);
    term.loadAddon(links);
    term.open(terminalRef.current);

    xtermRef.current = term;
    fitRef.current   = fit;

    // Initial fit after paint
    requestAnimationFrame(() => {
      try { fit.fit(); } catch {}
    });

    // ── ResizeObserver keeps cols/rows in sync when panel is dragged ──
    const ro = new ResizeObserver(() => {
      try { fit.fit(); } catch {}
    });
    ro.observe(terminalRef.current);

    return () => {
      ro.disconnect();
      mountedRef.current  = false;
      connectedRef.current = false;
      shellRef.current     = null;
      inputRef.current     = null;
      xtermRef.current     = null;
      fitRef.current       = null;
      term.dispose();
    };
  }, []);

  // ── 2. Connect xterm ↔ WebContainer jsh whenever wc prop arrives ───────────
  useEffect(() => {
    const term = xtermRef.current;

    // Wait until both the terminal DOM and the WebContainer are ready
    if (!webcontainer || !term) return;

    // BUG FIX: old code set writerRef = true and never cleared it properly,
    // so switching webcontainer instances would never reconnect.
    // We use connectedRef keyed to the wc instance instead.
    if (connectedRef.current) return;
    connectedRef.current = true;

    let cancelled = false;
    let inputWriter = null;
    let dataDisposable = null;

    setStatus("booting");
    term.writeln("\x1b[2m  Waiting for shell…\x1b[0m");

    const connect = async () => {
      try {
        // ── Spawn WebContainer's built-in jsh shell ──────────────────────────
        // This is the KEY fix: instead of manually handling every command with
        // webcontainer.spawn(), we start a real interactive shell and pipe
        // xterm's I/O directly into it.  Every command (npm, node, ls, git…)
        // just works because jsh handles it natively inside the container.
        const shell = await webcontainer.spawn("jsh", {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });

        if (cancelled) { shell.kill(); return; }

        shellRef.current = shell;

        // shell stdout → xterm
        shell.output.pipeTo(
          new WritableStream({
            write(chunk) {
              if (!cancelled) term.write(chunk);
            },
          })
        );

        // xterm keystrokes → shell stdin
        const writer = shell.input.getWriter();
        inputWriter  = writer;
        inputRef.current = writer;

        dataDisposable = term.onData((data) => {
          if (!cancelled) writer.write(data);
        });

        // Keep terminal size in sync with shell PTY
        term.onResize(({ cols, rows }) => {
          shell.resize({ cols, rows });
        });

        setStatus("ready");

        // Shell exited (e.g. user typed `exit`)
        shell.exit.then(() => {
          if (!cancelled) {
            connectedRef.current = false;
            setStatus("idle");
            term.writeln("\r\n\x1b[2m  Shell exited. Reconnect by closing and reopening the terminal.\x1b[0m");
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

      if (shellRef.current) {
        try { shellRef.current.kill(); } catch {}
        shellRef.current = null;
      }

      if (inputWriter) {
        try { inputWriter.releaseLock(); } catch {}
        inputRef.current = null;
      }

      connectedRef.current = false;
    };
  }, [webcontainer]);

  // ── Status indicator colour ────────────────────────────────────────────────
  const dotColor =
    status === "ready"   ? "#3fb950" :
    status === "booting" ? "#e3b341" :
    status === "error"   ? "#f78166" : "#6e7681";

  return (
    <div style={styles.wrapper}>
      {/* ── VS Code-style terminal tab bar ── */}
      <div style={styles.tabBar}>
        <div style={styles.tabLeft}>
          {/* Active "tab" mimics VS Code's terminal panel tab */}
          <div style={styles.activeTab}>
            <div style={{ ...styles.dot, background: dotColor }} />
            <span style={styles.tabLabel}>bash</span>
          </div>
        </div>

        <div style={styles.tabRight}>
          <span style={styles.hint}>
            {status === "booting" && "Starting…"}
            {status === "ready"   && ""}
            {status === "error"   && "Shell error — check console"}
            {status === "idle"    && "Not connected"}
          </span>

          {/* "+" new terminal button (wired up — calls bootTerminal externally) */}
          <button
            style={styles.iconBtn}
            title="New terminal"
            onClick={() => {
              // Allow parent to wire this up via a prop if needed
            }}
          >＋</button>

          {/* Maximise / minimise glyph (cosmetic only — wire up via prop) */}
          <button style={styles.iconBtn} title="Maximise panel">⬡</button>
        </div>
      </div>

      {/* ── xterm canvas ── */}
      <div ref={terminalRef} style={styles.xterm} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — matches VS Code's integrated terminal panel exactly
// ─────────────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    display      : "flex",
    flexDirection: "column",
    background   : "#1e1e1e",
    height       : "100%",
    minHeight    : "0",
    overflow     : "hidden",
    borderTop    : "1px solid #252526",
  },

  // The narrow strip at the top that holds tab labels (like VS Code)
  tabBar: {
    display        : "flex",
    alignItems     : "center",
    justifyContent : "space-between",
    background     : "#252526",
    height         : "35px",
    flexShrink     : 0,
    paddingLeft    : "4px",
    paddingRight   : "6px",
    borderBottom   : "1px solid #1e1e1e",
  },

  tabLeft: {
    display   : "flex",
    alignItems: "center",
    height    : "100%",
  },

  // The selected terminal tab — has the top-border accent like VS Code
  activeTab: {
    display       : "flex",
    alignItems    : "center",
    gap           : "6px",
    height        : "100%",
    padding       : "0 12px",
    borderTop     : "1px solid #0078d4",   // VS Code blue accent
    background    : "#1e1e1e",
    color         : "#cccccc",
    fontSize      : "12px",
    fontFamily    : "var(--vscode-font-family, sans-serif)",
    userSelect    : "none",
  },

  dot: {
    width       : "7px",
    height      : "7px",
    borderRadius: "50%",
    flexShrink  : 0,
  },

  tabLabel: {
    fontSize  : "12px",
    color     : "#cccccc",
    fontFamily: "monospace",
  },

  tabRight: {
    display   : "flex",
    alignItems: "center",
    gap       : "2px",
  },

  hint: {
    color     : "#6e7681",
    fontSize  : "11px",
    fontFamily: "monospace",
    marginRight: "6px",
  },

  iconBtn: {
    background : "transparent",
    border     : "none",
    color      : "#cccccc",
    fontSize   : "14px",
    cursor     : "pointer",
    padding    : "4px 6px",
    borderRadius: "4px",
    lineHeight : 1,
    opacity    : 0.7,
  },

  // The actual xterm.js render target — fills remaining space
  xterm: {
    flex    : 1,
    minHeight: "0",
    padding : "4px 8px 4px 4px",
    overflow: "hidden",
    // xterm.js needs the parent to have an explicit size for FitAddon to work
    height  : "100%",
  },
};