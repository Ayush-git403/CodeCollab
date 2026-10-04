import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location          = useLocation();

  if (loading) return (
    <div style={{
      background: "#0D1117", minHeight: "100vh",
      display: "flex", alignItems: "center",
      justifyContent: "center", color: "#58A6FF",
      fontSize: "16px", fontFamily: "monospace",
    }}>
      Loading...
    </div>
  );

  if (!user) {
    // Preserve the page they tried to visit so we can redirect back after login
    const next = location.pathname.replace("/", "");
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}