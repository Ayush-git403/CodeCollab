import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const ran = useRef(false); // StrictMode runs effects twice in dev

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    const userB64 = params.get("user");

    // remove the token from the address bar / history right away
    window.history.replaceState(null, "", window.location.pathname);

    try {
      if (!token || !userB64) throw new Error("Missing token");
      const b64 = userB64.replace(/-/g, "+").replace(/_/g, "/");
      const user = JSON.parse(atob(b64));
      login(token, user);
      navigate("/dashboard", { replace: true });
    } catch {
      navigate("/login?error=oauth", { replace: true });
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#8B949E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
      }}
    >
      Signing you in...
    </div>
  );
}