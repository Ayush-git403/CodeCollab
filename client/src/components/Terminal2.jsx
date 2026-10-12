import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function Terminal2({ webcontainer }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const writerRef = useRef(false);
  const lineRef = useRef("");
  const historyRef = useRef([]);
  const histIdxRef = useRef(-1);
  const cwdRef = useRef("~");
  const processRef = useRef(null);
  const readyRef = useRef(false);

  const [ready, setReady] = useState(false);

  // Create and dispose the terminal UI.
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
    xtermRef.current = term;

    const timer = setTimeout(() => {
      try {
        fit.fit();
      } catch {
        // Terminal may no longer be mounted.
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      processRef.current = null;
      readyRef.current = false;
      lineRef.current = "";
      writerRef.current = false;
      xtermRef.current = null;
      term.dispose();
    };
  }, []);

  // Connect the terminal to the existing WebContainer.
  useEffect(() => {
    const term = xtermRef.current;

    if (!webcontainer || !term || writerRef.current) return;

    let cancelled = false;
    let dataDisposable = null;
    let runningCommand = false;

    writerRef.current = true;
    setReady(false);
    readyRef.current = false;

    const showPrompt = () => {
      if (cancelled) return;

      term.write(
        `\r\n\x1b[1;32m${cwdRef.current}\x1b[0m \x1b[1;34m$\x1b[0m `
      );
    };

    const runCommand = async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        showPrompt();
        return;
      }

      historyRef.current.unshift(trimmed);
      if (historyRef.current.length > 50) {
        historyRef.current.pop();
      }
      histIdxRef.current = -1;

      // Change directory.
      if (trimmed === "cd" || trimmed.startsWith("cd ")) {
        const target = trimmed === "cd" ? "~" : trimmed.slice(3).trim();

        let nextCwd;

        if (!target || target === "~") {
          nextCwd = "/";
        } else if (target.startsWith("/")) {
          nextCwd = target;
        } else {
          const base = cwdRef.current === "~" ? "/" : cwdRef.current;
          nextCwd = `${base.replace(/\/$/, "")}/${target}`;
        }

        try {
          const result = await webcontainer.spawn("test", ["-d", nextCwd]);
          const exitCode = await result.exit;

          if (cancelled) return;

          if (exitCode === 0) {
            cwdRef.current = nextCwd === "/" ? "~" : nextCwd;
          } else {
            term.writeln(
              `\r\n\x1b[31mcd: ${target}: No such directory\x1b[0m`
            );
          }
        } catch {
          if (!cancelled) {
            term.writeln(
              `\r\n\x1b[31mcd: ${target}: No such directory\x1b[0m`
            );
          }
        }

        showPrompt();
        return;
      }

      // Clear screen.
      if (trimmed === "clear" || trimmed === "cls") {
        term.clear();
        showPrompt();
        return;
      }

      // Print current directory.
      if (trimmed === "pwd") {
        term.writeln(cwdRef.current === "~" ? "/home/user" : cwdRef.current);
        showPrompt();
        return;
      }

      // Run commands through WebContainer.
      try {
        const cwd = cwdRef.current === "~" ? "/" : cwdRef.current;

        // Basic quoted-argument support.
        const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const cmd = parts.shift();
        const args = parts.map((arg) =>
          arg.startsWith('"') && arg.endsWith('"')
            ? arg.slice(1, -1)
            : arg
        );

        if (!cmd) {
          showPrompt();
          return;
        }

        const child = await webcontainer.spawn(cmd, args, { cwd });

        if (cancelled) {
          child.kill();
          return;
        }

        processRef.current = child;
        term.write("\r\n");

        const outputPromise = child.output.pipeTo(
          new WritableStream({
            write(chunk) {
              if (!cancelled) term.write(chunk);
            },
          })
        );

        await child.exit;
        await outputPromise.catch(() => {});

        if (processRef.current === child) {
          processRef.current = null;
        }
      } catch (err) {
        if (!cancelled) {
          term.writeln(
            `\r\n\x1b[31m${err?.message || `${trimmed}: command failed`}\x1b[0m`
          );
        }
      }

      showPrompt();
    };

    const start = async () => {
      term.writeln("\x1b[1;34m⚡ CodeCollab Terminal\x1b[0m");
      term.writeln("\x1b[90mConnecting to Node.js environment...\x1b[0m");

      try {
        if (cancelled) return;

        term.writeln("\r\n\x1b[90mReady! Type commands below.\x1b[0m");
        showPrompt();

        readyRef.current = true;
        setReady(true);

        dataDisposable = term.onData(async (data) => {
          if (cancelled) return;

          // Ctrl+C: interrupt the running process when possible.
          if (data === "\x03") {
            if (processRef.current) {
              processRef.current.kill();
              processRef.current = null;
              term.write("^C");
              lineRef.current = "";
              showPrompt();
            } else {
              lineRef.current = "";
              term.write("^C");
              showPrompt();
            }
            return;
          }

          if (data === "\x0c") {
            term.clear();
            showPrompt();
            return;
          }

          if (data === "\r") {
            if (runningCommand) return;

            const command = lineRef.current;
            lineRef.current = "";
            runningCommand = true;

            try {
              await runCommand(command);
            } finally {
              runningCommand = false;
            }
            return;
          }

          if (data === "\x7f") {
            if (lineRef.current.length > 0) {
              lineRef.current = lineRef.current.slice(0, -1);
              term.write("\b \b");
            }
            return;
          }

          if (data === "\x1b[A") {
            const history = historyRef.current;
            if (history.length === 0) return;

            histIdxRef.current = Math.min(
              histIdxRef.current + 1,
              history.length - 1
            );

            term.write("\r\x1b[2K");
            lineRef.current = history[histIdxRef.current];
            term.write(
              `\x1b[1;32m${cwdRef.current}\x1b[0m \x1b[1;34m$\x1b[0m ${lineRef.current}`
            );
            return;
          }

          if (data === "\x1b[B") {
            histIdxRef.current = Math.max(histIdxRef.current - 1, -1);

            term.write("\r\x1b[2K");
            lineRef.current =
              histIdxRef.current === -1
                ? ""
                : historyRef.current[histIdxRef.current];

            term.write(
              `\x1b[1;32m${cwdRef.current}\x1b[0m \x1b[1;34m$\x1b[0m ${lineRef.current}`
            );
            return;
          }

          if (data === "\t") {
            try {
              const cwd = cwdRef.current === "~" ? "/" : cwdRef.current;
              const child = await webcontainer.spawn("ls", [], { cwd });

              let output = "";

              const outputPromise = child.output.pipeTo(
                new WritableStream({
                  write(chunk) {
                    output += chunk;
                  },
                })
              );

              await child.exit;
              await outputPromise;

              if (cancelled) return;

              if (output.trim()) {
                term.write(`\r\n${output}`);
                showPrompt();
                term.write(lineRef.current);
              }
            } catch {
              // Ignore autocomplete errors.
            }
            return;
          }

          if (data >= " " && data !== "\x7f" && !data.startsWith("\x1b")) {
            lineRef.current += data;
            term.write(data);
          }
        });
      } catch (err) {
        if (!cancelled) {
          setReady(false);
          readyRef.current = false;
          term.writeln(
            `\r\n\x1b[31mTerminal initialization failed: ${err.message}\x1b[0m`
          );
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      dataDisposable?.dispose();

      if (processRef.current) {
        processRef.current.kill();
        processRef.current = null;
      }

      writerRef.current = false;
      readyRef.current = false;
    };
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
