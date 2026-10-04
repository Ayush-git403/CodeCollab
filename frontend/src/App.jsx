import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home   from "./pages/Home";
import Login     from "./pages/Login";
import UserSpace from "./pages/UserDashboard";
import Room      from "./pages/Room";
import CreateRoom     from "./pages/CreateRoom";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"      element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route path="/app" element={
            <ProtectedRoute><UserSpace /></ProtectedRoute>
          }/>
          <Route path="/room/:roomId" element={
            <ProtectedRoute><Room /></ProtectedRoute>
          }/>
          <Route path="/create" element={
            <ProtectedRoute><CreateRoom /></ProtectedRoute>
          }/>

          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/app"   replace />} />
          <Route path="*"          element={<Navigate to="/"      replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}