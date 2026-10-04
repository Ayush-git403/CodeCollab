import { AnimatePresence, motion } from "motion/react";
import { Children, cloneElement, useEffect, useId, useState } from "react";

export function AnimatedBackground({
  children,
  defaultValue,
  onValueChange,
  transition,
  enableHover = false,
  backgroundStyle = {},
}) {
  const [activeId, setActiveId] = useState(null);
  const uniqueId = useId();

  const handleSetActiveId = (id) => {
    setActiveId(id);
    if (onValueChange) onValueChange(id);
  };

  useEffect(() => {
    if (defaultValue !== undefined) setActiveId(defaultValue);
  }, [defaultValue]);

  return Children.map(children, (child, index) => {
    const id = child.props["data-id"];

    const interactionProps = enableHover
      ? {
          onMouseEnter: () => handleSetActiveId(id),
          onMouseLeave: () => handleSetActiveId(null),
        }
      : { onClick: () => handleSetActiveId(id) };

    return cloneElement(child, {
      key: index,
      style: {
        ...child.props.style,
        position: "relative",
      },
      "data-checked": activeId === id ? "true" : "false",
      ...interactionProps,
      children: (
        <>
          <AnimatePresence initial={false}>
            {activeId === id && (
              <motion.div
                layoutId={`background-${uniqueId}`}
                transition={transition}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "inherit",
                  zIndex: 0,
                  ...backgroundStyle,
                }}
              />
            )}
          </AnimatePresence>
          <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
            {child.props.children}
          </div>
        </>
      ),
    });
  });
}

export default AnimatedBackground;