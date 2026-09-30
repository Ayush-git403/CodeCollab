import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      // =========================
      // SIGN UP
      // =========================
      if (tab === "signup") {
        const res = await axios.post(
          "http://localhost:5000/api/auth/signup",
          {
            username,
            email,
            password,
          }
        );

        login(res.data.token, res.data.user);

        navigate("/dashboard");
      }

      // =========================
      // LOGIN
      // =========================
      else {
        const res = await axios.post(
          "http://localhost:5000/api/auth/login",
          {
            email,
            password,
          }
        );

        login(res.data.token, res.data.user);

        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login/Signup error:", err);

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
        {/* =========================
            LOGO
        ========================= */}
        <div style={S.logoRow}>
          <span style={{ fontSize: "28px" }}>⚡</span>

          <div>
            <p style={S.logoTitle}>CodeCollab Arena</p>

            <p style={S.logoSub}>
              Code together. Compete. Build.
            </p>
          </div>
        </div>

        {/* =========================
            TAB SWITCHER
        ========================= */}
        <div style={S.tabs}>
          <button
            type="button"
            style={{
              ...S.tab,
              ...(tab === "login" ? S.tabActive : {}),
            }}
            onClick={() => {
              setTab("login");
              setError("");
              setShowPassword(false);
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            style={{
              ...S.tab,
              ...(tab === "signup" ? S.tabActive : {}),
            }}
            onClick={() => {
              setTab("signup");
              setError("");
              setShowPassword(false);
            }}
          >
            Sign Up
          </button>
        </div>

        {/* =========================
            FORM
        ========================= */}
        <div style={S.form}>
          {/* USERNAME - SIGNUP ONLY */}
          {tab === "signup" && (
            <div style={S.field}>
              <label style={S.label}>Username</label>

              <input
                style={S.input}
                type="text"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* EMAIL */}
          <div style={S.field}>
            <label style={S.label}>Email</label>

            <input
              style={S.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={tab === "login"}
            />
          </div>

          {/* PASSWORD */}
          <div style={S.field}>
            <label style={S.label}>Password</label>

            <div style={S.passwordWrapper}>
              <input
                style={S.passwordInput}
                type={showPassword ? "text" : "password"}
                placeholder={
                  tab === "signup"
                    ? "Min 6 characters"
                    : "••••••••"
                }
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
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
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
          {error && (
            <div style={S.error}>
              ⚠ {error}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="button"
            style={{
              ...S.submitBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : tab === "login"
                ? "Sign In →"
                : "Create Account →"}
          </button>
        </div>

        {/* =========================
            FOOTER
        ========================= */}
        <p style={S.footer}>
          {tab === "login"
            ? "Don't have an account? "
            : "Already have an account? "}

          <span
            style={S.footerLink}
            onClick={() => {
              setTab(
                tab === "login"
                  ? "signup"
                  : "login"
              );

              setError("");
              setShowPassword(false);
            }}
          >
            {tab === "login"
              ? "Sign up"
              : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

const S = {
  // =========================
  // PAGE
  // =========================
  page: {
    minHeight: "100vh",
    background: "#0D1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  // =========================
  // CARD
  // =========================
  card: {
    background: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "14px",
    padding: "36px",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  // =========================
  // LOGO
  // =========================
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logoTitle: {
    color: "#58A6FF",
    fontWeight: "bold",
    fontSize: "18px",
    margin: 0,
  },

  logoSub: {
    color: "#8B949E",
    fontSize: "12px",
    margin: 0,
  },

  // =========================
  // TABS
  // =========================
  tabs: {
    display: "flex",
    background: "#0D1117",
    padding: "4px",
    borderRadius: "8px",
    border: "1px solid #30363D",
  },

  tab: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "#8B949E",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.15s",
  },

  tabActive: {
    background: "#21262D",
    color: "#C9D1D9",
    border: "1px solid #30363D",
  },

  // =========================
  // FORM
  // =========================
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
    color: "#8B949E",
    fontSize: "13px",
    fontWeight: "500",
  },

  input: {
    background: "#0D1117",
    border: "1px solid #30363D",
    borderRadius: "8px",
    color: "#C9D1D9",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },

  // =========================
  // PASSWORD
  // =========================
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },

  passwordInput: {
    width: "100%",
    boxSizing: "border-box",
    background: "#0D1117",
    border: "1px solid #30363D",
    borderRadius: "8px",
    color: "#C9D1D9",
    padding: "10px 44px 10px 14px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },

  // =========================
  // EYE BUTTON
  // =========================
  eyeButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#8B949E",
    cursor: "pointer",
    padding: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // =========================
  // ERROR
  // =========================
  error: {
    background: "rgba(247,129,102,0.1)",
    border: "1px solid #F78166",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#F78166",
    fontSize: "13px",
  },

  // =========================
  // SUBMIT
  // =========================
  submitBtn: {
    background: "#238636",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "4px",
  },

  // =========================
  // FOOTER
  // =========================
  footer: {
    color: "#8B949E",
    fontSize: "13px",
    textAlign: "center",
    margin: 0,
  },

  footerLink: {
    color: "#58A6FF",
    cursor: "pointer",
    textDecoration: "underline",
  },
};