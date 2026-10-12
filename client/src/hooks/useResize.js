import { useRef, useCallback } from "react";

export default function useResize(initialSize, min, max, direction = "horizontal") {
  const sizeRef  = useRef(initialSize);
  const frameRef = useRef(null);

  const startResize = useCallback((e) => {
    e.preventDefault();
    const startPos  = direction === "horizontal" ? e.clientX : e.clientY;
    const startSize = sizeRef.current;

    const onMove = (moveEvent) => {
      const delta = direction === "horizontal"
        ? moveEvent.clientX - startPos
        : moveEvent.clientY - startPos;

      const newSize = Math.min(Math.max(startSize + delta, min), max);
      sizeRef.current = newSize;

      if (frameRef.current) {
        if (direction === "horizontal") {
          frameRef.current.style.width = `${newSize}px`;
        } else {
          frameRef.current.style.height = `${newSize}px`;
        }
      }
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }, [direction, min, max]);

  return { frameRef, startResize };
}
