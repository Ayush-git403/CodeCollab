import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

const DialogContext = createContext(null);

function useDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error(
      "Dialog components must be used inside <Dialog>"
    );
  }

  return context;
}

// --------------------------------------------------
// DIALOG
// --------------------------------------------------

export function Dialog({
  children,
  open,
  onOpenChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;

  const isOpen = isControlled
    ? open
    : internalOpen;

  const setIsOpen = (value) => {
    if (!isControlled) {
      setInternalOpen(value);
    }

    if (onOpenChange) {
      onOpenChange(value);
    }
  };

  return (
    <DialogContext.Provider
      value={{
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

// --------------------------------------------------
// TRIGGER
// --------------------------------------------------

export function DialogTrigger({
  children,
  className = "",
  style = {},
  ...props
}) {
  const { setIsOpen } = useDialog();

  return (
    <button
      type="button"
      {...props}
      className={className}
      style={style}
      onClick={(event) => {
        if (props.onClick) {
          props.onClick(event);
        }

        setIsOpen(true);
      }}
    >
      {children}
    </button>
  );
}

// --------------------------------------------------
// CONTENT
// --------------------------------------------------

export function DialogContent({
  children,
  className = "",
  style = {},
  transition = {
    type: "spring",
    bounce: 0.15,
    duration: 0.5,
  },
}) {
  const { isOpen, setIsOpen } = useDialog();

  // ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen]);

  // Prevent page scrolling
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          style={styles.overlay}
          onMouseDown={(event) => {
            // Clicking outside closes dialog
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          {/* BACKDROP */}

          <motion.div
            style={styles.backdrop}
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
          />

          {/* DIALOG */}

          <motion.div
            role="dialog"
            aria-modal="true"
            className={className}
            style={{
              ...styles.dialog,
              ...style,
            }}
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 10,
            }}
            transition={transition}
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// --------------------------------------------------
// HEADER
// --------------------------------------------------

export function DialogHeader({
  children,
  className = "",
}) {
  return (
    <div
      className={className}
      style={styles.header}
    >
      {children}
    </div>
  );
}

// --------------------------------------------------
// TITLE
// --------------------------------------------------

export function DialogTitle({
  children,
  className = "",
  style = {},
}) {
  return (
    <h2
      className={className}
      style={{
        ...styles.title,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

// --------------------------------------------------
// DESCRIPTION
// --------------------------------------------------

export function DialogDescription({
  children,
  className = "",
  style = {},
}) {
  return (
    <p
      className={className}
      style={{
        ...styles.description,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// --------------------------------------------------
// CLOSE
// --------------------------------------------------

export function DialogClose({
  children,
  className = "",
  style = {},
}) {
  const { setIsOpen } = useDialog();

  return (
    <button
      type="button"
      aria-label="Close dialog"
      className={className}
      style={{
        ...styles.close,
        ...style,
      }}
      onClick={() => setIsOpen(false)}
    >
      {children || "×"}
    </button>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  backdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(0, 0, 0, 0.65)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  },

  dialog: {
    position: "relative",
    zIndex: 1,
  },

  header: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  title: {
    margin: 0,
  },

  description: {
    margin: 0,
  },

  close: {
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "6px",
    background: "transparent",
    color: "#8B949E",
    fontSize: "22px",
    lineHeight: 1,
    cursor: "pointer",
    zIndex: 10,
  },
};