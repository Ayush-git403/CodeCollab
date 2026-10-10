import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://codecollab-d0p4.onrender.com/api/auth/login",
        {
          email,
          password,
        }
      );

      login(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      console.log("STATUS:", err?.response?.status);
      console.log("BACKEND RESPONSE:", err?.response?.data);

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* LOGO */}
        <div style={S.logoRow}>
          <span style={{ fontSize: "28px" }}>⚡</span>
          <div>
            <p style={S.logoTitle}>CodeCollab Arena</p>
            <p style={S.logoSub}>Code together. Compete. Build.</p>
          </div>
        </div>

        {/* FORM */}
        <div style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Email</label>
            <input
              style={S.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>Password</label>
            <div style={S.passwordWrapper}>
              <input
                style={S.passwordInput}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleSubmit();
                  }
                }}
              />

              <button
                type="button"
                style={S.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && <div style={S.error}>{error}</div>}

          {/* SUBMIT */}
          <button
            type="button"
            style={{
              ...S.submitBtn,
              ...(hovered === "submit" && !loading
                ? S.submitBtnHover
                : {}),
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={() => setHovered("submit")}
            onMouseLeave={() => setHovered(null)}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Sign In →"}
          </button>
        </div>

        {/* OAUTH */}
        <div style={S.oauthSection}>
          <div style={S.oauthDivider}>
            <span style={S.dividerLine} />
            <span style={S.dividerText}>OR</span>
            <span style={S.dividerLine} />
          </div>

          <button
            type="button"
            style={S.oauthBtn}
            aria-label="Continue with Google"
            title="Continue with Google"
          >
            <span style={S.oauthIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.39Z"
                />
                <path
                  fill="#34A853"
                  d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.04H3.29v2.5A9.75 9.75 0 0 0 12 21.5Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.53 13.59A5.86 5.86 0 0 1 6.22 12c0-.55.11-1.08.31-1.59V7.91H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.09l3.24-2.5Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.37c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.44 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.71 5.41l3.24 2.5c.77-2.32 2.93-4.04 5.47-4.04Z"
                />
              </svg>
            </span>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            style={S.oauthBtn}
            aria-label="Continue with GitHub"
            title="Continue with GitHub"
          >
            <span style={S.oauthIcon} aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.24c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.5.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23A11.45 11.45 0 0 1 12 6.02c1.02 0 2.05.14 3.01.42 2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.76.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
              </svg>
            </span>
            <span>Continue with GitHub</span>
          </button>
        </div>

        {/* FOOTER */}
        <p style={S.footer}>
          Don't have an account?{" "}
          <span
            style={S.footerLink}
            role="button"
            tabIndex={0}
            onClick={() => navigate("/signup")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/signup");
              }
            }}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  card: {
    background: "#191919",
    border: "1px solid #2D2D2D",
    borderRadius: "14px",
    padding: "36px",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logoTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "18px",
    margin: 0,
    letterSpacing: "-0.3px",
  },

  logoSub: {
    color: "#8B949E",
    fontSize: "12px",
    margin: 0,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    color: "#E8E8E8",
    fontSize: "13px",
    fontWeight: "600",
  },

  input: {
    background: "#111111",
    border: "2px solid #555555",
    borderRadius: "8px",
    color: "#FFFFFF",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },

  passwordWrapper: {
    position: "relative",
    width: "100%",
  },

  passwordInput: {
    width: "100%",
    boxSizing: "border-box",
    background: "#111111",
    border: "2px solid #555555",
    borderRadius: "8px",
    color: "#FFFFFF",
    padding: "10px 44px 10px 14px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },

  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#B8B8B8",
    cursor: "pointer",
    padding: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  error: {
    background: "rgba(247,129,102,0.1)",
    border: "1px solid #F78166",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#F78166",
    fontSize: "13px",
  },

  submitBtn: {
    background: "#FFFFFF",
    color: "#111111",
    border: "1px solid #FFFFFF",
    borderRadius: "7px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
    transition: "all 0.15s ease",
  },

  submitBtnHover: {
    background: "#E6E6E6",
    borderColor: "#E6E6E6",
    transform: "translateY(-1px)",
  },

  oauthSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "-2px",
  },

  oauthDivider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "2px 0 4px",
  },

  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#3A3A3A",
  },

  dividerText: {
    color: "#A0A0A0",
    fontSize: "12px",
    fontWeight: "500",
    lineHeight: 1,
  },

  oauthBtn: {
    width: "100%",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    background: "#21262D",
    color: "#E6EDF3",
    border: "1px solid #30363D",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "inherit",
  },

  oauthIcon: {
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  footer: {
    color: "#8B949E",
    fontSize: "13px",
    textAlign: "center",
    margin: 0,
  },

  footerLink: {
    color: "#FFFFFF",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
};
```