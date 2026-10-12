import { useRef, useCallback } from "react";

// useResize(initialSize, min, max, direction, reverse)
//
//  direction "horizontal" → resizes width,  "vertical" → resizes height
//  reverse   false → dragging right/down makes the panel bigger (left/top panels)
//            true  → dragging left/up makes the panel bigger (right/bottom panels)
//
// frameRef is a callback ref, so when a panel unmounts and mounts again
// (e.g. the terminal closing and reopening) it comes back at its last size.
export default function useResize(
  initialSize,
  min,
  max,
  direction = "horizontal",
  reverse = false,
) {
  const sizeRef = useRef(initialSize);
  const nodeRef = useRef(null);

  const apply = useCallback(
    (size) => {
      const node = nodeRef.current;
      if (!node) return;
      if (direction === "horizontal") node.style.width = `${size}px`;
      else node.style.height = `${size}px`;
    },
    [direction],
  );

  const frameRef = useCallback(
    (node) => {
      nodeRef.current = node;
      if (node) apply(sizeRef.current);
    },
    [apply],
  );

  const startResize = useCallback(
    (e) => {
      e.preventDefault();
      const startPos = direction === "horizontal" ? e.clientX : e.clientY;
      const startSize = sizeRef.current;

      document.body.style.userSelect = "none";
      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";

      const onMove = (moveEvent) => {
        const pos =
          direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const delta = reverse ? startPos - pos : pos - startPos;
        const newSize = Math.min(Math.max(startSize + delta, min), max);
        sizeRef.current = newSize;
        apply(newSize);
      };

      const onUp = () => {
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [direction, reverse, min, max, apply],
  );

  return { frameRef, startResize };
}