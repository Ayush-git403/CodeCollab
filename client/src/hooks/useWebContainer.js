import { useState, useRef, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

export default function useWebContainer() {
  const [status, setStatus]         = useState("idle");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [wc, setWc]                 = useState(null);
  const wcRef                       = useRef(null);

  const bootTerminal = useCallback(async (fileCache) => {
    if (wcRef.current) return wcRef.current;
    setStatus("booting");

    try {
      const instance = await WebContainer.boot();
      wcRef.current  = instance;
      setWc(instance);

      const files = {};
      Object.entries(fileCache).forEach(([name, content]) => {
        if (!name) return;
        files[name] = { file: { contents: content || "" } };
      });

      if (!files["package.json"]) {
        files["package.json"] = {
          file: {
            contents: JSON.stringify({
              name: "project",
              version: "1.0.0",
              dependencies: {},
            }, null, 2),
          },
        };
      }

      await instance.mount(files);

      instance.on("server-ready", (port, url) => {
        setPreviewUrl(url);
      });

      setStatus("ready");
      return instance;
    } catch (err) {
      setStatus("error");
      console.error("WebContainer error:", err);
      return null;
    }
  }, []);

  const syncFile = useCallback(async (filename, content) => {
    if (!wcRef.current) return;
    try {
      await wcRef.current.fs.writeFile(filename, content);
    } catch { /* silent */ }
  }, []);

  return { status, previewUrl, wc, bootTerminal, syncFile };
}