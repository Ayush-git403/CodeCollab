// A single file shows a small amber dot; a collapsed folder shows a count.
export default function UnreviewedDot({ title, count = 1 }) {
  const isPill = count > 1;

  return (
    <span
      title={title}
      style={{
        flexShrink: 0,
        marginLeft: 4,
        minWidth: isPill ? 16 : 8,
        height: isPill ? 16 : 8,
        padding: isPill ? "0 4px" : 0,
        borderRadius: 8,
        background: "#E3B341",
        boxShadow: "0 0 0 3px rgba(227,179,65,0.18)",
        color: "#0D1117",
        fontSize: 10,
        fontWeight: 700,
        lineHeight: "16px",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      {isPill ? count : ""}
    </span>
  );
}