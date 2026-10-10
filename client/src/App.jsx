import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import Room from "./pages/Room";
import CreateRoom from "./pages/CreateRoom";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />

          {/* Protected pages */}
          <Route
            path="/app"
            element={<ProtectedRoute><UserDashboard /></ProtectedRoute>}
          />
          <Route
            path="/create"
            element={<ProtectedRoute><CreateRoom /></ProtectedRoute>}
          />
          <Route
            path="/room/:roomId"
            element={<ProtectedRoute><Room /></ProtectedRoute>}
          />

          {/* Keep old dashboard links working */}
          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
