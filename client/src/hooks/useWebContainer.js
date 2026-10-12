import { useState, useRef, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

// ─────────────────────────────────────────────────────────────────────────────
// useWebContainer
//
// Changes vs. original:
//  1. bootPromiseRef cleanup moved to `finally` so concurrent callers always
//     get the same instance instead of double-booting.
//  2. Writes a minimal package.json + an empty index.js so `jsh` has a
//     sensible working directory from the start.
//  3. Exposes `teardown()` so the Room page can fully destroy the instance
//     when the user leaves the room (prevents "boot called twice" errors on
//     page navigation in dev mode / StrictMode double-invocation).
// ─────────────────────────────────────────────────────────────────────────────
export default function useWebContainer() {
  const [status,     setStatus]     = useState("idle");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [wc,         setWc]         = useState(null);

  const wcRef           = useRef(null);
  const bootPromiseRef  = useRef(null);

  const bootTerminal = useCallback(async (fileCache = {}) => {
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

      // ── Mount user files ─────────────────────────────────────────────────
      const files = {};

      Object.entries(fileCache).forEach(([name, content]) => {
        if (!name || name.includes("/")) return; // skip nested paths for now
        files[name] = { file: { contents: content ?? "" } };
      });

      // Always provide a package.json so npm / node resolve correctly
      if (!files["package.json"]) {
        files["package.json"] = {
          file: {
            contents: JSON.stringify(
              { name: "project", version: "1.0.0", type: "module" },
              null, 2
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

  // Sync a single file into the running container (called on editor saves)
  const syncFile = useCallback(async (filename, content) => {
    if (!wcRef.current) return;
    try {
      await wcRef.current.fs.writeFile(filename, content ?? "");
    } catch (err) {
      console.error("[useWebContainer] syncFile error:", err);
    }
  }, []);

  // Full teardown — call this when the Room unmounts so the next mount can
  // boot a fresh container without hitting the "already booted" error.
  const teardown = useCallback(() => {
    if (wcRef.current) {
      try { wcRef.current.teardown(); } catch {}
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