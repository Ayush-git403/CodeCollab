import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

const API_URL = "https://codecollab-d0p4.onrender.com";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/signup`, {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      login(res.data.token, res.data.user);

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "app";
      navigate(`/${next}`, { replace: true });
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logoRow}>
          <div style={S.logoMark}>C</div>
          <div>
            <p style={S.logoTitle}>CodeCollab Arena</p>
            <p style={S.logoSub}>Code together. Compete. Build.</p>
          </div>
        </div>

        <div>
          <h1 style={S.heading}>Create your account</h1>
          <p style={S.description}>
            Join the arena and start building together.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.field}>
            <label htmlFor="username" style={S.label}>Username</label>
            <input
              id="username"
              style={S.input}
              type="text"
              placeholder="yourname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div style={S.field}>
            <label htmlFor="email" style={S.label}>Email</label>
            <input
              id="email"
              style={S.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div style={S.field}>
            <label htmlFor="password" style={S.label}>Password</label>
            <div style={S.passwordWrapper}>
              <input
                id="password"
                style={S.passwordInput}
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button
                type="button"
                style={S.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div role="alert" style={S.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              ...S.submitBtn,
              ...(hovered && !loading ? S.submitBtnHover : {}),
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p style={S.footer}>
          Already have an account?{" "}
          <Link to="/login" style={S.footerLink}>
            Sign in
          </Link>
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
    maxWidth: "420px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    boxSizing: "border-box",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoMark: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#111111",
    display: "grid",
    placeItems: "center",
    fontSize: "22px",
    fontWeight: "800",
  },
  logoTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "18px",
    margin: 0,
  },
  logoSub: {
    color: "#8B949E",
    fontSize: "12px",
    margin: "4px 0 0",
  },
  heading: {
    color: "#FFFFFF",
    fontSize: "26px",
    margin: "0 0 8px",
  },
  description: {
    color: "#8B949E",
    fontSize: "14px",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  label: {
    color: "#E8E8E8",
    fontSize: "13px",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#111111",
    border: "1px solid #444444",
    borderRadius: "8px",
    color: "#FFFFFF",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    width: "100%",
    boxSizing: "border-box",
    background: "#111111",
    border: "1px solid #444444",
    borderRadius: "8px",
    color: "#FFFFFF",
    padding: "12px 44px 12px 14px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
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
    borderRadius: "8px",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "600",
    marginTop: "4px",
    transition: "all 0.15s ease",
  },
  submitBtnHover: {
    background: "#E6E6E6",
    borderColor: "#E6E6E6",
    transform: "translateY(-1px)",
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
    textUnderlineOffset: "3px",
  },
};