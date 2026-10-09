import { useState, useEffect } from "react";

export default function Timer({ seconds }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const color = timeLeft < 60 ? "#F78166" : "#58A6FF";

  return (
    <div style={{ color, fontSize: "22px", fontWeight: "bold", fontFamily: "monospace" }}>
      ⏱ {mins}:{secs}
    </div>
  );
}