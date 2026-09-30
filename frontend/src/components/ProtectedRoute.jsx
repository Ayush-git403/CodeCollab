import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{
      background: "#0D1117", minHeight: "100vh",
      display: "flex", alignItems: "center",
      justifyContent: "center", color: "#58A6FF", fontSize: "16px",
    }}>
      Loading...
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  return children;
}