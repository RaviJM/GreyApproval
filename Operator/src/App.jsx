import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import OperatorDashboard from "./pages/OperatorDashboard";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("operatorToken");

  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <OperatorDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
