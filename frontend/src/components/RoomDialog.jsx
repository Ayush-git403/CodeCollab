import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "./core/dialog";

import { useNavigate } from "react-router-dom";

export default function RoomDialog({ open, onOpenChange }) {
  const navigate = useNavigate();

  const handleRoomSelect = (type) => {
    if (type === "room") {
      navigate("/admin?type=room");
    }

    if (type === "contest") {
      navigate("/admin?type=contest");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogTrigger style={S.createButton}>
        + Create a Room
      </DialogTrigger>

      <DialogContent
        style={S.dialogContent}
        transition={{
          type: "spring",
          bounce: 0.15,
          duration: 0.5,
        }}
      >
        <DialogHeader>
          <DialogTitle style={S.title}>
            What do you want to create?
          </DialogTitle>

          <DialogDescription style={S.description}>
            Choose the type of room to set up
          </DialogDescription>
        </DialogHeader>

        <div style={S.options}>

          {/* Collaborative Room */}
          <button
            type="button"
            style={S.roomOption}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#58A6FF";
              e.currentTarget.style.background = "#161B22";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363D";
              e.currentTarget.style.background = "#0D1117";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onClick={() => handleRoomSelect("room")}
          >
            <div
              style={{
                ...S.iconBox,
                background: "#DDF4FF",
              }}
            >
              🏠
            </div>

            <div style={S.optionContent}>
              <h3 style={S.optionTitle}>
                Collaborative Room
              </h3>

              <p style={S.optionDescription}>
                Team joins one shared editor. Everyone codes
                together in real time.
              </p>
            </div>
          </button>

          {/* Contest Room */}
          <button
            type="button"
            style={S.roomOption}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#F78166";
              e.currentTarget.style.background = "#161B22";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#30363D";
              e.currentTarget.style.background = "#0D1117";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onClick={() => handleRoomSelect("contest")}
          >
            <div
              style={{
                ...S.iconBox,
                background: "#FFF8C5",
              }}
            >
              ⚡
            </div>

            <div style={S.optionContent}>
              <h3 style={S.optionTitle}>
                Contest Room
              </h3>

              <p style={S.optionDescription}>
                Set a target output. Everyone races to match it.
                Live leaderboard.
              </p>
            </div>
          </button>

        </div>

        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}

const S = {
  createButton: {
    background: "#238636",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "12px 22px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s ease, transform 0.2s ease",
  },

  dialogContent: {
    width: "100%",
    maxWidth: "480px",
    boxSizing: "border-box",
    background: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "16px",
    padding: "28px",
    boxShadow:
      "0 24px 80px rgba(0, 0, 0, 0.45)",
    color: "#E6EDF3",
  },

  title: {
    color: "#58A6FF",
    fontSize: "24px",
    fontWeight: "700",
    textAlign: "center",
    margin: 0,
  },

  description: {
    color: "#8B949E",
    fontSize: "14px",
    lineHeight: "1.5",
    textAlign: "center",
    marginTop: "8px",
  },

  options: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "24px",
  },

  roomOption: {
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "18px",
    borderRadius: "12px",
    border: "1px solid #30363D",
    background: "#0D1117",
    color: "#E6EDF3",
    textAlign: "left",
    cursor: "pointer",
    transition:
      "border-color 0.2s ease, background 0.2s ease, transform 0.2s ease",
    fontFamily: "inherit",
  },

  iconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    flexShrink: 0,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    margin: 0,
    color: "#E6EDF3",
    fontSize: "16px",
    fontWeight: "700",
  },

  optionDescription: {
    margin: "5px 0 0",
    color: "#8B949E",
    fontSize: "13px",
    lineHeight: "1.5",
  },
};