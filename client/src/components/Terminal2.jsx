import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function Terminal2({ webcontainer }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const writerRef = useRef(null);
  const lineRef = useRef("");
  const historyRef = useRef([]);
  const histIdxRef = useRef(-1);
  const cwdRef = useRef("~");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "Fira Code, Consolas, monospace",
      rows: 14,
      scrollback: 2000,
      theme: {
        background: "#0D1117",
        foreground: "#C9D1D9",
        cursor: "#58A6FF",
        green: "#3FB950",
        yellow: "#E3B341",
        blue: "#58A6FF",
        red: "#F78166",
        cyan: "#56D4DD",
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);
    setTimeout(() => fit.fit(), 100);
    xtermRef.current = term;

    return () => {
      term.dispose();
      xtermRef.current = null;
      writerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!webcontainer || !xtermRef.current || writerRef.current) return;

    const start = async () => {
      const term = xtermRef.current;

      term.writeln("\x1b[1;34m⚡ CodeCollab Terminal\x1b[0m");
      term.writeln("\x1b[90mBooting Node.js environment...\x1b[0m");

      try {
        // Mount a basic shell script to disable echo
        await webcontainer.fs.writeFile(
          "/.term-init.sh",
          "stty -echo 2>/dev/null; exec jsh",
        );
      } catch {
        /* ignore */
      }

      const showPrompt = () => {
        term.write(
          `\r\n\x1b[1;32m${cwdRef.current}\x1b[0m \x1b[1;34m$\x1b[0m `,
        );
      };

      const runCommand = async (cmd) => {
        const trimmed = cmd.trim();
        if (!trimmed) {
          showPrompt();
          return;
        }

        // Save to history
        historyRef.current.unshift(trimmed);
        if (historyRef.current.length > 50) historyRef.current.pop();
        histIdxRef.current = -1;

        // Handle cd manually since it changes directory
        if (trimmed.startsWith("cd ") || trimmed === "cd") {
          const target = trimmed === "cd" ? "~" : trimmed.slice(3).trim();
          try {
            if (target === "~" || target === "/") {
              cwdRef.current = target === "~" ? "~" : "/";
            } else if (target === "..") {
              const parts = cwdRef.current.split("/").filter(Boolean);
              parts.pop();
              cwdRef.current = parts.length === 0 ? "~" : "/" + parts.join("/");
            } else {
              cwdRef.current =
                cwdRef.current === "~"
                  ? `~/${target}`
                  : `${cwdRef.current}/${target}`;
            }
          } catch {
            term.writeln(`\x1b[31mcd: ${target}: No such directory\x1b[0m`);
          }
          showPrompt();
          return;
        }

        // Handle clear
        if (trimmed === "clear" || trimmed === "cls") {
          term.clear();
          showPrompt();
          return;
        }

        // Handle pwd
        if (trimmed === "pwd") {
          const display =
            cwdRef.current === "~" ? "/home/user" : cwdRef.current;
          term.writeln(`\r\n${display}`);
          showPrompt();
          return;
        }

        // Run everything else via WebContainer spawn
        try {
          const parts = trimmed.split(" ");
          const cmd = parts[0];
          const args = parts.slice(1);

          // Resolve path based on cwd
          const cwd = cwdRef.current === "~" ? "/" : cwdRef.current;

          const process = await webcontainer.spawn(cmd, args, { cwd });

          term.write("\r\n");

          process.output.pipeTo(
            new WritableStream({
              write(chunk) {
                term.write(chunk);
              },
            }),
          );

          const code = await process.exit;
          if (code !== 0 && code !== null) {
            // Non-zero exit — already printed error via stderr
          }
        } catch (err) {
          term.writeln(`\r\n\x1b[31m${trimmed}: command not found\x1b[0m`);
        }

        showPrompt();
      };

      term.write("\r\n\x1b[90mReady! Type commands below.\x1b[0m");
      showPrompt();
      setReady(true);

      // Handle keyboard input
      term.onData(async (data) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          // Enter
          const cmd = lineRef.current;
          lineRef.current = "";
          await runCommand(cmd);
        } else if (code === 127) {
          // Backspace
          if (lineRef.current.length > 0) {
            lineRef.current = lineRef.current.slice(0, -1);
            term.write("\b \b");
          }
        } else if (code === 3) {
          // Ctrl+C
          lineRef.current = "";
          term.write("^C");
          showPrompt();
        } else if (code === 12) {
          // Ctrl+L — clear screen
          term.clear();
          showPrompt();
        } else if (data === "\x1b[A") {
          // Arrow up — history
          const history = historyRef.current;
          if (history.length === 0) return;
          histIdxRef.current = Math.min(
            histIdxRef.current + 1,
            history.length - 1,
          );
          const prev = history[histIdxRef.current];
          // Clear current line
          term.write("\b \b".repeat(lineRef.current.length));
          lineRef.current = prev;
          term.write(prev);
        } else if (data === "\x1b[B") {
          // Arrow down — history
          const history = historyRef.current;
          histIdxRef.current = Math.max(histIdxRef.current - 1, -1);
          term.write("\b \b".repeat(lineRef.current.length));
          if (histIdxRef.current === -1) {
            lineRef.current = "";
          } else {
            lineRef.current = history[histIdxRef.current];
            term.write(lineRef.current);
          }
        } else if (data === "\x1b[C") {
          // Arrow right — ignore for now
        } else if (data === "\x1b[D") {
          // Arrow left — ignore for now
        } else if (data === "\t") {
          // Tab — basic autocomplete: list files
          try {
            const cwd = cwdRef.current === "~" ? "/" : cwdRef.current;
            const process = await webcontainer.spawn("ls", [], { cwd });
            let out = "";
            process.output.pipeTo(
              new WritableStream({
                write(chunk) {
                  out += chunk;
                },
              }),
            );
            await process.exit;
            if (out.trim()) {
              term.write("\r\n" + out);
              showPrompt();
              term.write(lineRef.current);
            }
          } catch {
            /* ignore */
          }
        } else if (code >= 32) {
          // Printable character
          lineRef.current += data;
          term.write(data);
        }
      });
    };

    start();
  }, [webcontainer]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: ready ? "#3FB950" : "#E3B341",
              flexShrink: 0,
            }}
          />
          <span style={styles.title}>Terminal</span>
          {ready && <span style={styles.cwd}>{cwdRef.current}</span>}
        </div>
        <span style={styles.hint}>
          {ready
            ? "node file.js  •  cd folder  •  ls  •  npm install"
            : "Starting Node.js environment..."}
        </span>
      </div>
      <div ref={terminalRef} style={styles.terminal} />
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    background: "#0D1117",
    borderTop: "2px solid #58A6FF",
    flexShrink: 0,
    minHeight: "240px",
    height: "240px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 12px",
    background: "#161B22",
    borderBottom: "1px solid #30363D",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  title: {
    color: "#C9D1D9",
    fontSize: "12px",
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  cwd: {
    color: "#58A6FF",
    fontSize: "11px",
    fontFamily: "monospace",
    background: "#21262D",
    padding: "1px 6px",
    borderRadius: "4px",
  },
  hint: {
    color: "#8B949E",
    fontSize: "11px",
    fontFamily: "monospace",
  },
  terminal: {
    padding: "4px 8px",
    flex: 1,
    overflow: "hidden",
  },
};
