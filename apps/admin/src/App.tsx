import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { useAuthStore } from "./store/authStore";
import { api } from "./lib/api";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import ShopsPage from "./pages/ShopsPage";
import UsersPage from "./pages/UsersPage";
import LogsPage from "./pages/LogsPage";
import toast from "react-hot-toast";

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { isAdmin } = useAuthStore();

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #e4ebf3", borderTopColor: "#111111", borderRadius: "50%" }} />
      </div>
    );
  }

  if (!isSignedIn || !isAdmin) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { setIsAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && user) {
      api.getStats()
        .then(() => {
          setIsAdmin(true);
        })
        .catch((err) => {
          console.error("Verification failed:", err);
          setIsAdmin(false);
          signOut().then(() => {
            toast.error("Access Denied. Your email is not registered as an Admin.");
            navigate("/auth/login");
          });
        });
    } else if (isLoaded && !user) {
      setIsAdmin(false);
    }
  }, [user, isLoaded, setIsAdmin, signOut, navigate]);

  return (
    <Routes>
      <Route path="/auth/login" element={<AuthPage />} />

      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/shops" element={<ShopsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Stub for AdminLayout to satisfy routing
import { AdminLayout } from "./components/AdminLayout";

