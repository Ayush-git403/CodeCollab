import { useState, useRef, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

export default function useWebContainer() {
  const [status, setStatus] = useState("idle");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [wc, setWc] = useState(null);

  const wcRef = useRef(null);
  const bootPromiseRef = useRef(null);

  const bootTerminal = useCallback(async (fileCache = {}) => {
    // Reuse an existing instance.
    if (wcRef.current) {
      return wcRef.current;
    }

    // Reuse a boot that is already in progress.
    if (bootPromiseRef.current) {
      return bootPromiseRef.current;
    }

    setStatus("booting");

    const bootPromise = (async () => {
      const instance = await WebContainer.boot();

      wcRef.current = instance;
      setWc(instance);

      const files = {};

      Object.entries(fileCache).forEach(([name, content]) => {
        if (!name) return;

        files[name] = {
          file: {
            contents: content || "",
          },
        };
      });

      if (!files["package.json"]) {
        files["package.json"] = {
          file: {
            contents: JSON.stringify(
              {
                name: "project",
                version: "1.0.0",
                dependencies: {},
              },
              null,
              2
            ),
          },
        };
      }

      await instance.mount(files);

      instance.on("server-ready", (_port, url) => {
        setPreviewUrl(url);
      });

      setStatus("ready");
      return instance;
    })();

    bootPromiseRef.current = bootPromise;

    try {
      return await bootPromise;
    } catch (err) {
      setStatus("error");
      console.error("WebContainer error:", err);
      return null;
    } finally {
      bootPromiseRef.current = null;
    }
  }, []);

  const syncFile = useCallback(async (filename, content) => {
    if (!wcRef.current) return;

    try {
      await wcRef.current.fs.writeFile(filename, content);
    } catch (err) {
      console.error("Failed to sync file:", err);
    }
  }, []);

  return {
    status,
    previewUrl,
    wc,
    bootTerminal,
    syncFile,
  };
}