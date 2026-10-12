import { useState, useRef, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

// ─────────────────────────────────────────────────────────────────────────────
// useWebContainer
//
//  1. bootPromiseRef cleanup lives in `finally`, so concurrent callers always
//     get the same instance instead of double-booting.
//  2. bootTerminal(fileCache, fileList) mounts real folders and nested files,
//     so `cd client`, `ls`, etc. match what you see in the explorer.
//  3. syncFile creates missing parent folders before writing.
//  4. teardown() fully destroys the instance when the Room unmounts.
// ─────────────────────────────────────────────────────────────────────────────
export default function useWebContainer() {
  const [status, setStatus] = useState("idle");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [wc, setWc] = useState(null);

  const wcRef = useRef(null);
  const bootPromiseRef = useRef(null);

  // fileCache: { "index.html": "...", "client/App.jsx": "..." }
  // fileList : the explorer's `files` array, used to find folder entries
  const bootTerminal = useCallback(async (fileCache = {}, fileList = []) => {
    // Return existing live instance immediately
    if (wcRef.current) return wcRef.current;

    // Return the in-progress boot promise so concurrent callers don't
    // double-boot (WebContainer.boot() throws if called twice per page)
    if (bootPromiseRef.current) return bootPromiseRef.current;

    setStatus("booting");

    const promise = (async () => {
      const instance = await WebContainer.boot();
      wcRef.current = instance;
      setWc(instance);

      // ── Mount user files (with real folders and nested paths) ────────────
      const files = {};

      const ensureDir = (parts) => {
        let node = files;
        for (const part of parts) {
          if (!node[part] || !node[part].directory) {
            node[part] = { directory: {} };
          }
          node = node[part].directory;
        }
        return node;
      };

      const folderNames = new Set(
        fileList.filter((f) => f.type === "folder").map((f) => f.name),
      );

      // Create every folder first, so empty ones exist too
      folderNames.forEach((name) =>
        ensureDir(name.split("/").filter(Boolean)),
      );

      // Then place every file inside its folder
      Object.entries(fileCache).forEach(([name, content]) => {
        if (folderNames.has(name)) return;
        const parts = name.split("/").filter(Boolean);
        if (parts.length === 0) return;
        const dir = ensureDir(parts.slice(0, -1));
        dir[parts[parts.length - 1]] = { file: { contents: content ?? "" } };
      });

      // Always provide a package.json so npm / node resolve correctly
      if (!files["package.json"]) {
        files["package.json"] = {
          file: {
            contents: JSON.stringify(
              { name: "project", version: "1.0.0", type: "module" },
              null,
              2,
            ),
          },
        };
      }

      await instance.mount(files);

      // Listen for dev-server ready events (e.g. Vite, Next)
      instance.on("server-ready", (_port, url) => {
        setPreviewUrl(url);
      });

      setStatus("ready");
      return instance;
    })();

    bootPromiseRef.current = promise;

    try {
      return await promise;
    } catch (err) {
      setStatus("error");
      console.error("[useWebContainer] boot error:", err);
      wcRef.current = null;
      setWc(null);
      return null;
    } finally {
      // Always clear the in-flight ref so future calls can retry
      bootPromiseRef.current = null;
    }
  }, []);

  // Sync a single file into the running container (called on editor changes)
  const syncFile = useCallback(async (filename, content) => {
    if (!wcRef.current) return;
    try {
      const slash = filename.lastIndexOf("/");
      if (slash > 0) {
        await wcRef.current.fs.mkdir(filename.slice(0, slash), {
          recursive: true,
        });
      }
      await wcRef.current.fs.writeFile(filename, content ?? "");
    } catch (err) {
      console.error("[useWebContainer] syncFile error:", err);
    }
  }, []);

  // Full teardown — call this when the Room unmounts so the next mount can
  // boot a fresh container without hitting the "already booted" error.
  const teardown = useCallback(() => {
    if (wcRef.current) {
      try {
        wcRef.current.teardown();
      } catch {}
      wcRef.current = null;
    }
    bootPromiseRef.current = null;
    setWc(null);
    setStatus("idle");
    setPreviewUrl(null);
  }, []);

  return {
    status,
    previewUrl,
    wc,
    bootTerminal,
    syncFile,
    teardown,
  };
}